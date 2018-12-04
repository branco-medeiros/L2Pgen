define(["types/token"], function(Token){


  class Parser{
    constructor(file){
      this.source = file;
      this.position = 0;
      this.current = null;
      this.skipWhiteSpace();
    }

    moveNext(){
      var token = Token.parse(this)
      this.position = token.end;
      this.current = token
      return token
    }

    require(value, msg){
      if(value == null) throw new Error("Internal error")
      var ok = false
      if(value.constructor === String){
        ok = this.current.text === value
      } else if(value.constructor === Number){
        ok = this.current.type === value
      } else {
        ok = !!value
      }
      var result = this.current
      if(ok) {
        this.position = result.end
        this.skipWhiteSpace()
      } else {
        this.syntaxError("required: " + (msg || value), result.start)
      }
      return result
    }

    skipWhiteSpace(){
      while(true){
        var tk = this.moveNext()
        if(!(tk.isSpc || tk.isNewLine)) break;
      }
    }

    parseSpells(){
      var spells = []
      while(true){
        spells.push(this.parseSpell())
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
      var v = this.require(Token.VAR, "Spell name")
      return v.text
    } //parseSpellName

    parseExpression(){
      var expr = []
      var v = this.parsePrimary();
      expr.push(...v);

      while(this.isBinaryOp()){
        expr.push(this.current)
        this.skipWhiteSpace()
        v = this.parsePrimary()
        expr.push(...v)
      }
      return expr
    } //parseExpression

    parsePrimary(){
      var tk = this.current
      if(tk.isVar) return this.parseVar()
      if(tk.isOpenParens) return this.parseGroup()
      if(tk.isNum) return this.parseNum()
      if(tk.isBoolean) return this.parseBoolean()
      return this.parseUnaryOp()
    }

    parseUnaryOp(){
      var v = this.require(this.isUnaryOp(), "Unary operator")
      var result = []
      result.push(v)
      var v = this.parsePrimary();
      result.push(...v)
      return result
    }

    parseGroup(){
      var result = []
      var v = this.require("(")
      result.push(v)
      v = this.parseExpression()
      result.push(...v)
      v = this.require(")")
      result.push(v)
      return result
    }

    parseNum(){
      var v = this.require(Token.NUM, "Number")
      return [v]
    }

    parseVar(){
      var v = this.require(Token.VAR, "Variable name")
      return [v]
    }

    parseBoolean(){
      var v = this.require(Token.BOOLEAN, "Boolean literal")
      return [v]
    }

    isEOF(){
      return this.position >= this.source.length
    }

    isBinaryOp(){
      var tk = this.current
      return tk.isOp || tk.isOr || tk.isAnd
    }

    isUnaryOp(){
      var tk = this.current
      return tk.isNot || tk.text === "+" || tk.text === "-"
    }

    syntaxError(text, position){
      throw new Error("Syntax Error: " + text + " at position " + (position || this.position))
    }

    static parse(value){
      var p = new Parser(value);
      return p.parseSpells()
    }
  } //Parser

  return Parser
})
