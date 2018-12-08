/***
to be used in the icy-veins page to collect
the spells ids
*/

var spells = [], dict = {}
jQuery("a.spell").each(function(i, a){
  a = jQuery(a)
  var id = a.text().replace(/\b([a-z])/g, (l) => l.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "")
  if(dict[id]) return
  var sid = /[^\d](\d+)$/.exec(a.attr("href"))
  if(!sid) return
  var t = id + " = " + sid[1]
  spells.push(t)
  dict[id] = t
  console.log(t)
})
window.Spells = spells
