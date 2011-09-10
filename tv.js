/*!
 * Tangible values for Javascript
 *
 * Copyright 2011, Conal Elliott, BSD3
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

// Pair input
function iPair(left,right) {
    return function (parent,change) {
        var top = $(parent);
        top.append('<table><tr><td></td><td></td></table>');
        var cells = top.find('td'),
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
        top.append('<table><tr><td></td><td></td></table>');
        var cells = top.find('td'),
            changeA = left (cells[0]),
            changeB = right(cells[1]);
        return function (xs) { changeA(xs[0]); changeB(xs[1]); };
    };
};

// Function outputs
function oFunction(input,output) { 
    return function (parent) {
        // Insert two new divs and fill them in with the input & output.
        var top = $(parent);
        top.append("<div></div><div></div>");
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
    top.append("<span></span>");
    var span = top.find("span").first();
    return function (string) { span.text(string); } // bind(span,text)
};

// Simple input slider
function iSliderSimple(min,max,value) {
    return function (parent,change) {
        var top = $(parent);
        top.append("<div></div>");
        var slider = top.find("div").first();
        slider.slider({ animate: true, range: "min", step: 1.0e-6
                      , min: min, max: max, value: value
                      , slide: function (_,ui) { change(ui.value); }
                     });
        return value;
    };
};

// Fancy slider with attached type-in field. The user can tweak either
// one, and the other will update accordingly. Decorate the slider
// with min & max values.
function iSlider(min,max,value) {
    return function (parent,change) {
        var top = $(parent);
        top.append('\
                   <table style="width:100%"><tr>\
                   <td class="slider-min" style="width:0px"></td>\
                   <td><div></div></td>\
                   <td class="slider-max" style="width:0px"></td>\
                   <td style="width:5px"></td>\
                   <td style="width:0px"><input type="text" size="8"></td>\
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
        slider.slider({ animate: true, range: "min", step: 1.0e-6
                      , min: min, max: max, value: value
                      , slide: function (_,ui) {
                          field.val(ui.value);
                          change(ui.value);
                        }
                     });
        // Conversely, when the input field is edited, move the slider.
        field.change(function () {
                         var val = Number(field.val());
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
                var top    = $(this),
                    gui    = eval(top.attr("gui")),
                    value  = eval(top.attr("value")),
                    change = gui(top);
                change(value);
                top[0].change = change; // for possible later use
            });
});


// More succinctly:

/*
$(function () {
  $(".TV").append(function () {
    eval($(this).attr("gui"))($(this))(eval($(this).attr("value"))); });
});
*/

