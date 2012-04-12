/*!
 * Tangible values for Javascript
 *
 * Copyright 2011-2012, Conal Elliott, Sean Seefried, BSD3
 *
 * Depends on jQuery and jQuery UI
 */

/*
GUI specifications are "rendering" functions that add content to a
given parent node.

Input: take parent and a function to get applied to each new value
taken on, and return the input's initial value.

Output: take parent and return a function to apply whenever there
is a new value to present.

Layout pairs horizontally and functions vertically.

Pair values are represented as arrays. TODO: Perhaps use general
arrays instead.

TODO: Maybe have output rendering take an initial value.

*/


/*
 * All inputs have Haskell-like type of
      DOMObject -> (a -> IO b) -> a

 * Outputs have a Haskell-like type of
      DOMObject -> (a -> IO ())
 */

var TV = (function() {
  // Pair input
  function iPair(whole_label, left,left_label,right,right_label) {
      return function (parent,change) {
          var top = $(parent);
          top.append('<table class="ipair">\
                      <tr><td span="2">'+whole_label+'</td></tr>\
                      <tr class="ipair-left">\
                        <td>' + left_label + '</td>\
                        <td class="value"></td>\
                      </tr>\
                      <tr class="ipair-right">\
                        <td>' + right_label + '</td>\
                        <td class="value"></td>\
                      </tr>\
                     </table>');
          var cells = top.find('td.value'),
              currentValue,
              a0 = left (cells[0], function (a) {
                      currentValue[0] = a; change(currentValue); }),
              b0 = right(cells[1], function (b) {
                      currentValue[1] = b; change(currentValue); }),
              currentValue = [a0,b0];
          return currentValue;
      };
  };

  // Pair output
  function oPair(left,right) {
      return function (parent) {
          var top = $(parent);
          top.append('<table class="opair">\
                      <tr>\
                        <td class="opair-left"></td>\
                        <td class="opair-right"></td>\
                      </tr>\
                      </table>');
          var cells = top.find('td'),
              changeA = left (cells[0]),
              changeB = right(cells[1]);
          return function (xs) { changeA(xs[0]); changeB(xs[1]); };
      };
  };

  // Function outputs
  function oFunction(label, input,output) {
      return function (parent) {
          // Insert two new divs and fill them in with the input & output.
          var top = $(parent);
          top.append('<div class="ofunction-input">'+label+'</div>\
                      <div class="ofunction-output"></div>');
          var divs = top.find("div"),
              changeOut = output(divs[1]),
              currentFun, currentIn,  // too soon to fill in
              updateOut = function () { changeOut(currentFun(currentIn)); };
          currentIn = input(divs[0],function (a) { currentIn = a; updateOut(); });
          return function (f) { currentFun = f; updateOut(); };
      };
  };

  // Text output. Javascript will convert from printable values.
  function oText(parent) {
      var top = $(parent);
      top.append('<span class="otext"></span>');
      var span = top.find("span").first();
      return function (string) { span.text(string); } // bind(span,text)
  };

  // Simple input slider
  function iSliderSimple(min,max,value) {
      return function (parent,change) {
          var top = $(parent);
          top.append('<div></div>');
          var slider = top.find("div").first();
          slider.slider({ animate: true, range: "min", step: 1.0e-6
                        , min: min, max: max, value: value
                        , slide: function (_,ui) { change(ui.value); }
                       });
          return value;
      };
  };

  function iCheckBox(value) {
    return function(parent,change) {
      var top = $(parent);
      top.append('<input type="checkbox" ' + (value ? "checked" : "") + '>');
      var box = top.find("input").first();
      box.click(function() {
        change(this.checked);
      });
      return value;
    };
  }

  // Fancy slider with attached type-in field. The user can tweak either
  // one, and the other will update accordingly. Decorate the slider
  // with min & max values.
  //
  // 'type' can be either 'int' or 'float'

  function iSlider(min,max,type,value) {
      var step = (type == 'int') ? 1.0 : 1.0e-6;

      return function (parent,change) {
          var top = $(parent);
          top.append('\
                     <table class="islider"><tr>\
                     <td class="slider-min" style="width:1px"></td>\
                     <td><div></div></td>\
                     <td class="slider-max" style="width:1px"></td>\
                     <td style="width:5px"></td>\
                     <td style="width:1px"><input type="text" size="8"></td>\
                     </tr></table>\
                     ');
          var slider = top.find("div").first(),
              field  = top.find("input").first();
          // Decorate the slider
          top.find(".slider-min").append(min);
          top.find(".slider-max").append(max);
          // Initialize input field to match slider
          field.val(value);
          // When the slider moves, update the input field.
          slider.slider({ animate: true, range: "min", step: step
                        , min: min, max: max, value: value
                        , slide: function (_,ui) {
                            field.val(ui.value);
                            change(ui.value);
                          }
                       });
          // Conversely, when the input field is edited, move the slider.
          field.change(function () {
                           var val = Number(field.val());
                           if (type=='int') { val = Math.round(val); }
                           slider.slider("option","value",val);
                           change(val);
                       });
          return value;
      };
  };

  // Synthesize guis from class TV, eval'ing attributes "gui" and
  // "value", inserting GUI elements into the given TV DOM element. Also
  // adds a 'change' function to that element to allow later dynamic
  // change.

  // $(function () { $("#tv-val-show").text("hi there"); });

  $(function () {
          $(".TV").append(function () {
                  var top    = $(this);
                  console.log(top.attr("value"));
                  var gui    = eval("(" + top.attr("gui") + ")"),
                      value  = eval("(" + top.attr("value") + ")"),
                      change = gui(top);
                  change(value);
                  top[0].change = change; // for possible later use
              });
  });

  /*
   *  e is an expression
   */
  function render(parent, e) {
    var o     = make(e),
        sink  = oFunction("", o.input, oText)($(parent)[0]);
    sink(o.fun);
  }

  /*
   *  Make returns an Input
   */
  function make(e) {
    var e1, e2, e3;

    switch (e.op) {
      case 'Add':
        e1 = make(e[1]);
        e2 = make(e[2]);
        return({ input: iPair("a + b", e1.input, "a", e2.input, "b"),
                 fun: function(p) {
                   return e1.fun(p[0]) + e2.fun(p[1]); }
               });
      break;

      case 'ReadInt':
        return({ input: iSlider(0,10,'int',5),
                 fun: function(a) { return a; }});
      break;

      case 'ReadFloat':
        return({ input: iSlider(0,10,'float',5),
                 fun: function(a) { return a;} });
      break;

      case 'ReadBool':
        return({ input: iCheckBox(true),
                 fun: function(a) { return a;}
               });
        break;

      case 'IfE':
        e1 = make(e[1]);
        e2 = make(e[2]);
        e3 = make(e[3]);
        return({ input: iPair("if a then b else c",
                              iPair("", e1.input, "a", e2.input, "b"), "", e3.input, "c"),
                 fun: function(p) {
                     var cond = p[0][0], thn = p[0][1], els = p[1];
                     return (e1.fun(cond) ? e2.fun(thn) : e3.fun(els));
                   }
               });
      break;

      case 'Lt':
        e1 = make(e[1]);
        e2 = make(e[2]);
        return({ input: iPair(e1.input, "a", e2.input, "b"),
                 fun: function(p) { return (p[0] < p[1]); }
               });
      break;

    }
  }

  return({ render: render });

})();
