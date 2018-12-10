define([], function(){

  class Generator{

    static capitalize(text){
      return text[0].toUpperCase() + text.substr(1).replace(/[-\.:]./g, function(v){
        return v[1].toUpperCase()
      })
    }

    static getSpellName(spell){
      var sep1 = spell.indexOf(".");
      var sep2 = spell.indexOf(":");
      var sep = sep1 < 0? sep2 : (sep2 < 0? sep1 : Math.min(sep1, sep2))
      if(sep >= 0) spell = spell.substr(0, sep);
      return Generator.capitalize(spell)
    }

    static spaces(size){
      return Array(Math.max(size, 1) + 1).join(" ")
    }

    static sortByName(a,b){
      return a.name === b.name? 0 : (a.name < b.name? -1 : 1)
    }

    static createSpecInfo(spec, spells){
      var info = {
        spec:spec,
        SPEC:spec.toUpperCase(),
        prio: [],
        variables: {},
        translate: {},
        attributes:{},
        spells: [],
        interrupt: "",
        dict: {}
      }

      spells.forEach(function(v){
        var spName = Generator.getSpellName(v.name);
        v.spName = spName
        v.fn = Generator.capitalize(v.name)

        //if this is just a spell id definition, skips the rest
        if(Generator.updateSpellId(info, v)) return

        if(v.name.endsWith(":interrupt")){
          info.interrupt = v.name

        } else if(v.name.indexOf(":") >= 0){
          Generator.createAttribute(info, v)
          return
        }

        v.expr.forEach(function(e){
          var text = e.text
          if(e.isVar){
            var t = info.variables[text];
            if(!t) info.variables[text] = "ctx." + Generator.capitalize(text)

          } else if(/^!/.test(text)){
            var t = info.translate[text]
            if(!t) info.translate[text] = text.replace(/!/g, "~")
          }
        })

        info.prio.push(v)
      })

      info.spells.sort(Generator.sortByName)
      return info
    } //createSpecInfo

    static updateSpellId(info, spell){
      var spName = spell.spName

      var id = 0;
      if(spell.expr.length === 1 && spell.expr[0].isNum) id = ~~spell.expr[0].text
      var s = info.dict[spName];
      if(!s){
        s = {name:spName, id: id}
        info.dict[spName] = s
        info.spells.push(s)
      }
      if(id)  s.id = id //updates the id of previously declared spell
      return id
    }


    static createAttribute(info, spell){
      var name = spell.name
      var key = Generator.getSpellName(name)
      var attributes = info.attributes
      var attrs = attributes[key]
      if(!attrs) {
        attrs = []
        attributes[key] = attrs
      }

      var value = spell.expr[0].text
      if(name.endsWith(":noinstant")){
        attrs.push("NoInstant=" + value)

      } else if(name.endsWith(":notarget")) {
        attrs.push("NoTarget=" + value)

      } else if(name.endsWith(":norange")) {
        attrs.push("NoRange=" + value)

      } else if(name.endsWith(":primary")) {
        attrs.push("Primary=" + value)

      } else if(name.endsWith(":secondary")) {
        attrs.push("Secondary=" + value)

      } else if(name.endsWith(":rangespell")) {
        value = info.spec + ".SID." + Generator.getSpellName(value)
        attrs.push("RangeSpell=" + value)

      } else {
        throw new Error("Invalid attribute (" + name + ")")
      }

    }

    static generateSource(source, result){
      result = result || []
      result.push("--[[")
      result.push(source)
      result.push("]]")
      result.push("")
    }

    static generateSID(specInfo, result){
      result = result || []
      var spec = specInfo.spec
      result.push(spec + ".SID = {")
      for(var s of specInfo.spells){
        result.push("  " + s.name + " = " + s.id + ",")
      }
      result.push("  zz = 0")
      result.push("}")
      result.push("")
      result.push(spec + ".SPN = Main:CreateSpellNames(" + spec + ".SID)")
      return result;
    }

    static generateFunctionList(specInfo, result){
      result = result || []
      var list = specInfo.prio.slice(0).sort(Generator.sortByName)
      var spec = specInfo.spec
      for(var spell of list){
        var fn = spell.fn;
        result.push(spec + ".on" + fn + " = function(this, ctx)")
        var expr = "  return "
        for(var e of spell.expr){
          var item = e.text
          if(e.isAnd || e.isOr){
            expr += "\r\n    " + item + " "

          } else if(item === "("){
            expr += "("

          } else if(item === ")"){
            expr += ") "

          } else if(e.isVar){
            expr += specInfo.variables[item] + " "

          } else if(e.isOp){
            expr += (specInfo.translate[item] || item) + " "

          } else {
            expr += item + " "

          }

        }
        result.push(expr)
        result.push("end")
        result.push("");
      } //for spell
      return result
    }

    static generateSpellList(specInfo, result){
      result = result || []
      var list = specInfo.prio.slice(0).sort(Generator.sortByName)
      var spec = specInfo.spec
      var SPEC = specInfo.SPEC
      var minSize = 0;
      list.forEach(function(v){
        minSize = Math.max(v.name.length, minSize)
      })
      minSize += 2

      list.map(function(v){
        var name = v.name
        var spname = v.spName
        var fn = Generator.capitalize(name)
        var sp1 = Generator.spaces(minSize - name.length)
        var sp2 = Generator.spaces(minSize - spname.length)
        var attrs = (specInfo.attributes[spname]|| []).join(", ")
        if(attrs.length) attrs = ", " + attrs
        return `  {${SPEC}, SPELL, "${name}",${sp1}${spec}.SID.${spname},${sp2}${spec}.on${fn}${attrs}},`
      }).forEach(v => result.push(v))
      return result;
    }

    static generatePrioList(specInfo, result){
      result = result || []
      var interrupt = specInfo.interrupt
      var SPEC = specInfo.SPEC
      for(var spell of specInfo.prio){
        var name = spell.name;
        if(interrupt === name) continue
        result.push(`  {${SPEC}, PRIO, "${name}"},`)
      }
      return result
    }

    static generateSpecInitialization(specInfo, result){
      result = result || []
      var SPEC = specInfo.SPEC
      var spec = specInfo.spec
      var interrupt = specInfo.interrupt
      result.push(`  {${SPEC}, INIT, ${spec}.Init},`)
      if(interrupt) result.push(`  {${SPEC}, INT, "${interrupt}"},`)
      return result
    }

    static generateInit(specInfo, result){
      var list = []
      var spec = specInfo.spec
      for(var k in specInfo.variables) list.push(specInfo.variables[k])
      list.sort()
      result.push(spec + ".Init = function(this, ctx)")
      result.push("  " + spec + ".doInit(this, ctx)")
      result.push("--[[")
      for(var v of list){
        result.push("  " + v + " = UNKNOWN")
      }
      result.push("]]")
      result.push("end")
      return result
    }

    static generate(spec, spells, source){
      var info = Generator.createSpecInfo(spec, spells)
      var result = []
      spec = info.spec
      result.push("local " + info.spec + " = {}")
      if(source) Generator.generateSource(source, result)
      Generator.generateSID(info, result)
      result.push("")
      Generator.generateFunctionList(info, result)
      result.push("")
      Generator.generateInit(info, result)
      result.push("")
      result.push(spec + ".SPEC = {")
      Generator.generateSpellList(info, result)
      result.push("")
      result.push("  --prio")
      Generator.generatePrioList(info, result)
      result.push("")
      Generator.generateSpecInitialization(info, result)
      result.push("}")

      return result.join("\r\n");
    }
  }

  return Generator
})
