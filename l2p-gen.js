var EOF = -1
var UNKNOWN = 0
var OR = 1
var AND = 2
var SPC = 3
var EQ = 5
var VAR = 6

Parser.EOF = EOF
Parser.OR = OR
Parser.AND = AND
Parser.SPC = SPC
Parser.VAR = VAR
Parser.EQ = EQ
Parser.UNKNOWN = UNKNOWN

var fs = require("fs")
var spec = process.argv[2]
var fname = process.argv[3]
console.log("[x] reading file ", fname)
var file = fs.readFileSync(fname)
console.log("[x] parsing...")
var spells = Parser.parse(file);
console.log("[x] generating...")
console.log(Generator.generate(spec, spells))
console.log("[x] OK")


class Parser{
  constructor(file){
    this.source = file;
    this.position = 0;
    this.current = null;
    this.matcher = /(\bor\b)|(\band\b)|(( |\t|\r\n|\n)+)|(=)|([a-zA-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*)/g
    this.skipWhiteSpace();
  }

  moveNext(){
    var tokens = [Parser.OR, Parser.AND, Parser.SPC, Parser.EQ, Parser.VAR]

    var token = {
      type: Parser.UNKNOWN,
      text: null,
      start: this.position,
      end: this.position
    }

    if(this.position >= this.source.length) {
      token.type = Parser.EOF;
      this.current = token;
      return token
    }

    matcher.lastIndex = this.position
    var match = this.matcher(file);

    if(!match) {
      this.current = token
      return token;
    }

    token.text = match[0]
    token.end = this.matcher.lastIndex
    this.position = this.matcher.lastIndex;

    for(var tk of tokens){
      if(match[tk]){
        token.type = tk
        break;
      }
    }

    this.current = token
    return token
  }

  skipWhiteSpace(){
    while(true){
      var tk = this.moveNext()
      if(tk.type !== Parser.SPC) break;
    }
  }

  require(value, msg){
    if(value == null) throw new Error("Internal error")
    var ok = false
    if(value.constructor === String){
      ok = this.current.text === value
    } else {
      ok = this.current.type === value
    }
    var result = this.current
    if(ok) {
      this.skipWhiteSpace()
    } else {
      this.syntaxError("required: " + (msg || value))
    }
    return result
  }

  parseSpells(){
    var spells = []
    while(true){
      spells.push(parseSpell())
      if(this.isEOF()) break;
    }
    return spells
  }

  parseSpell(){
    var spell = {name: "", expr:[]}
    spell.name = this.parseSpellName()
    this.require("=")
    spell.expr = this.parseExpression()
    return spell
  } //parseSpells

  parseSpellName(){
    var v = this.require(Parser.VAR, "Spell name")
    return v.text
  } //parseSpellName

  parseExpression(){
    var expr = []
    var v = require(Parser.VAR, "Variable name");
    expr.push(v.text);

    while(true){
      if(this.current.type === Parser.OR || this.current.type === Parser.AND){
        expr.push(this.current.text)
        this.skipWhiteSpace()

        v = require(Parser.VAR, "Variable name")
        expr.push(this.current.text)
      } else {
        break;
      }
    }
    return expr
  } //parseExpression

  isEOF(){
    return this.position >= this.source.length
  }

  syntaxError(text){
    throw new Error("Syntax Error: " + text + " at position " + this.position)
  }

  static parse(value){
    var p = new Parser(value);
    return p.parseSpells()
  }
} //Parser

class Generator{
  static getSpellName(spell){
    var num = /.+(-\d+)$/.exec(spell);
    if(num) spell = spell.substr(0, spell.length - num[1].length);
    return spell[0].toUpperCase() + spell.substr(1).replace(/-[a-z]/g, function(v){
      return v[1].toUpperCase()
    })
  }

  static generate(spec, spells){
    var result = []
    var variables = {}
    result.push("local " + spec + " = {}")

    for(var spell of spells){
      var spname = Generator.getSpellName(spell.name);
      spell.spName = spname
      result.push("");
      result.push(spec + ".on" + spname + " = function(this, ctx)")
      var expr = "  return "
      for(var x of spell.expr){
        if(x === "or" || x === "and"){
          expr += "\r\n    " + x + " "
        } else {
          var v = variables[x]
          if(!v){
            v = "ctx." + Generator.getSpellName(x)
            variables[x] = v
          }
          expr += v + " ";
        }
      }
      result.push(expr)
      result.push("end")
    } //for spell
    result.push(spec + ".SPEC = {")
    SPEC = spec.toUpperCase()

    for(var spell of spells){
      var name = spell.name;
      var spname = spell.spName
      result.push(`  {${SPEC}, SPELL, "${name}", ${spec}.SID.${spname}, ${spec}.on${spname}},`)
    }
    result.push("")
    result.push("--prio")

    for(var spell of spells){
      var name = spell.name;
      result.push(`  {${SPEC}, PRIO, "${name}"},`)
    }
    result.push("}")
    result.push("")
    result.push(spec + ".Init = function(this, ctx)")
    for(k in variables){
      var v = variables[k];
      result.push("  " + k + " = UNKNOWN")
    }
    result.push("end")
    return result.join("\r\n");
  }
}
