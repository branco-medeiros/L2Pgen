define([], function(){
  var ERROR = -1
  var EOF = 0
  var OR = 1
  var AND = 2
  var BOOLEAN = 3
  var NOT = 5
  var OP = 6
  var SPC = 7
  var NL = 8
  var EQ = 9
  var OPEN_PAR = 10
  var CLOSE_PAR = 11
  var VAR = 12
  var NUM = 15
  var UNKNOWN = 17

  var tokens = [OR, AND, BOOLEAN, NOT, OP, SPC, NL, EQ, OPEN_PAR, CLOSE_PAR, VAR, NUM, UNKNOWN]

  var rexOr = /(\bor\b)/ //1
  var rexAnd = /(\band\b)/ //2
  var rexBoolean = /(\b(true|false)\b)/ //3, 4
  var rexNot = /(\bnot\b)/ //5
  var rexOp = /([\+\-\*\/]|=[=><]|[<>~!]=?)/ //6
  var rexSpc = /([ \t]+)/ //7
  var rexNewLine = /(\r\n?|\n)/ //8
  var rexEq = /(=)/ //9
  var rexOpenPar = /(\()/ //10
  var rexClosePar = /(\))/ //11
  var rexVar = /([a-zA-Z][a-zA-Z0-9]*([-\.][a-zA-Z0-9]+)*(:[a-zA-Z0-9]+)?)/ //12, 13, 14
  var rexNum = /(\d+(\.\d+)?)/ //15, 16
  var rexUnknown = /(.)/ //17


  var matcher = new RegExp(
    rexOr.source + "|" +
    rexAnd.source + "|" +
    rexBoolean.source + "|" +
    rexNot.source + "|" +
    rexOp.source + "|" +
    rexSpc.source + "|" +
    rexNewLine.source + "|" +
    rexEq.source + "|" +
    rexOpenPar.source + "|" +
    rexClosePar.source + "|" +
    rexVar.source + "|" +
    rexNum.source + "|" +
    rexUnknown.source,
    'g'
  )
  //var matcher = /(\bor\b)|(\band\b)|([\+\-\*\/]|=[=><]|[<>~!]=?)|(( |\t|\r\n|\n)+)|(=)|(\()|(\))|([a-zA-Z][a-zA-Z0-9]*([-\.][a-zA-Z0-9]+)*)|(\d+(\.\d+)?)|(.)/g

  class Token{
    constructor(type, text, start, end){
      this.type = type;
      this.text = text;
      this.start = start
      this.end = end
    }

    get isError(){
      return this.type === ERROR
    }

    get isEof(){
      return this.type === EOF
    }

    get isOr(){
      return this.type === OR
    }

    get isAnd(){
      return this.type === AND
    }

    get isBoolean(){
      return this.type === BOOLEAN
    }

    get isNot(){
      return this.type === NOT
    }

    get isOp(){
      return this.type === OP
    }

    get isSpc(){
      return this.type === SPC
    }

    get isNewLine(){
      return this.type === NL
    }

    get isEq(){
      return this.type === EQ
    }

    get isOpenParens(){
      return this.type === OPEN_PAR
    }

    get isCloseParens(){
      return this.type === CLOSE_PAR
    }

    get isVar(){
      return this.type === VAR
    }

    get isNum(){
      return this.type === NUM
    }

    get isUnknown(){
      return this.type === UNKNOWN
    }

    asError(){
      this.type = ERROR
      return this
    }

    asEof(){
      this.type = EOF
      return this
    }

    asOr(){
      this.type = OR
      return this
    }

    asAnd(){
      this.type = AND
      return this
    }

    asBoolean(){
      this.type = BOOLEAN
      return this
    }

    asNot(){
      this.type = NOT
      return this
    }

    asOp(){
      this.type = OP
      return this
    }

    asSpc(){
      this.type = SPC
      return this
    }

    asNewLine(){
      this.type = NL
      return this
    }

    asEq(){
      this.type = EQ
      return this
    }

    asOpenParens(){
      this.type = OPEN_PAR
      return this
    }

    asCloseParens(){
      this.type = CLOSE_PAR
      return this
    }

    asVar(){
      this.type = VAR
      return this
    }

    asNum(){
      this.type = NUM
      return this
    }

    asUnknown(){
      this.type = UNKNOWN
      return this
    }

    static parse(parser){
      var result = new Token(EOF, null, parser.position, parser.position)

      if(parser.position >= parser.source.length) return result

      matcher.lastIndex = parser.position
      var match = matcher.exec(parser.source);

      if(!match) return result.asError()

      result.text = match[0]
      result.end = matcher.lastIndex

      for(var tk of tokens){
        if(match[tk]){
          result.type = tk
          break;
        }
      }

      return result

    }

  } //Token

  Token.ERROR = ERROR
  Token.EOF = EOF
  Token.OR = OR
  Token.AND = AND
  Token.BOOLEAN = BOOLEAN
  Token.NOT = NOT
  Token.OP = OP
  Token.SPC = SPC
  Token.NEW_LINE = NL
  Token.EQ = EQ
  Token.OPEN_PARENS = OPEN_PAR
  Token.CLOSE_PARENS = CLOSE_PAR
  Token.VAR = VAR
  Token.NUM = NUM
  Token.UNKNOWN = UNKNOWN

  return Token

})
