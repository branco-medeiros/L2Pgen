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
      } else {
        ok = this.current.type === value
      }
      var result = this.current
      if(ok) {
        this.position = result.end
        this.skipWhiteSpace()
      } else {
        this.syntaxError("required: " + (msg || value), this.current.start)
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
        expr.push(this.current.text)
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
      return this.parseUnaryOp()
    }

    parseUnaryOp(){
      var tk = this.current
      if(tk.text === "+" || tk.text === "-" || tk.text === "!" || tk.text === "~"){
        var result = []
        result.push(tk.text)
        this.skipWhiteSpace()
        var v = this.parsePrimary();
        result.push(...v)
        return result
      }
      this.syntaxError("Expected: Unary operator", tk.start)
    }

    parseGroup(){
      var result = []
      var v = this.require("(")
      result.push(v.text)
      v = this.parseExpression()
      result.push(...v)
      v = this.require(")")
      result.push(v.text)
      return result
    }

    parseNum(){
      var v = this.require(Token.NUM, "Number")
      return [v.text]
    }

    parseVar(){
      var v = this.require(Token.VAR, "Variable name")
      return [v.text]
    }

    isEOF(){
      return this.position >= this.source.length
    }

    isBinaryOp(){
      var tk = this.current
      return tk.isOp || tk.isOr || tk.isAnd
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
