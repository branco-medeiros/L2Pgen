define(["types/parser", "types/generator"],
function(Parser, Generator){

  function vm(){
    var self = this;
    self.hello = ko.observable("Hello, l2pgen")

    self.status = ko.observableArray()
    self.status.valid = ko.computed(function(){
      var v = self.status();
      return !!(v && v.length)
    })

    self.result = ko.observable()
    self.source = ko.observable()
    self.spec = ko.observable()


    self.generate = function(){
      self.result("")
      self.status([])
      var spec = (self.spec() || "nospec").replace(/[-\s]/g, "")
      var source = self.source()
      var parser
      try{
        self.status.push("[x] parsing...")
        parser = new Parser(source);
        self.parser = parser
        var spells = parser.parseSpells();
        self.spells = spells
        self.status.push("[x] generating...")
        self.result(Generator.generate(spec, spells, source))
        self.status.push("[x] OK")
      } catch(ex){
        self.status.push("[ERROR] " + ex.message)
        console.log(ex)
      }
    }
  }

  vm.types = {
    Parser: Parser,
    Generator: Generator
  }

  return vm
})
