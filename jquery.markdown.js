/**
 *   jQuery.Markdown.js v0.0.6
 *   Author: taknakamu
 *   Git: https://github.com/taknakamu/jquery-markdown
 *
 *   Copyright (c) 2013 Kosuke Nakamuta
 *   Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */
(function($) {
    $.fn.extend({
        markdown: function(options) {
            var defaults = {
                target_form : $(this).selector
            }
            options = $.extend(defaults, options);

            function markdownConvert(art_body) {
                var md = {
                    options : {
                        empty_mark : "\n" // "\n" or "<br>"
                    },
                    vs       : {},
                    variable : {
                        editbody : null,
                        stack : {
                            tag  : [],
                            text : []
                        },
                        text  : "",
                        html  : ""
                    },
                    convert : {
                        tags : {
                            hr : {
                                default : function()  { return "<hr />"; }
                            },
                            a  : {
                                default : function(href, v) { return '<a href="' + href + '">' + v + '</a>'; },
                                target_blank : function(href, v) { return '<a href="' + href + '" target="_blank">' + v + '</a>'; }
                            },
                            img : {
                                default : function(src, alt) { return '<img class="img-frame" style="max-width:100%;" src="' + src + '" alt="' + alt + '"/>'; }
                            },
                            pre : {
                                default : function(lang, v) { return '<pre class="brush: ' + lang.toLowerCase() + ';">' + v + '</pre>'; }
                            },
                            empty : {
                                default : function()  { return md.options.empty_mark; }
                            },
                            notag : {
                                default : function(tag, v) { return '<' + tag + '>' + v + '</' + tag + '>'; }
                            }
                        },
                        replacer : {
                            strong : ["__([^_]+)__", "\\\*\\\*([^*]+)\\\*\\\*"],
                            em     : ["_([^_]+)_", "\\\*([^*]+)\\\*"],
                            del    : ["~~([^~]+)~~"],
                            code   : ["`([^`]+)`"]
                        },
                        push : function(tag, text) {
                            if (md.convert.inStack()) {
                                if (typeof text === 'undefined') {
                                    text = tag;
                                }
                            } else {
                                md.variable.stack.tag.push(tag);
                            }
                            if (typeof text !== 'undefined') {
                                md.variable.stack.text.push(text);
                            }
                            return this;
                        },
                        pop : function(called) {
                            if (md.convert.inStack()) {
                                var tag = md.variable.stack.tag.pop();
                                var text = innerHtml = "";
                                var args = [];

                                while (typeof (text = md.variable.stack.text.shift()) !== 'undefined') {
                                    if ((tag === "pre" || tag === "a" || tag === "img") && args.length === 0) {
                                        args.push(text);
                                        continue;
                                    }
                                    md.convert.text(md.convert.text() + text);

                                    if (tag === "pre" || tag === "blockquote") {
                                        md.convert.text(md.convert.text() + md.options.empty_mark);
                                    }
                                }

                                if (tag === "blockquote") {
                                    md.convert.text(markdownConvert(md.convert.text()));
                                }

                                if (typeof called === 'undefined') {
                                    called = 'default';
                                }

                                if (args.length === 0 && !md.convert.tags[tag]) {
                                    args.push(tag);
                                    tag = "notag";
                                }
                                args.push(md.convert.text());

                                innerHtml = md.convert.tags[tag][called].apply(this, args);

                                $.each(md.convert.replacer, function(rep, regs) {
                                    $(regs).each(function(i, exp) {
                                        var regexp = new RegExp(exp, "g");
                                        innerHtml = innerHtml.replace(regexp, '<' + rep + '>$1</' + rep + '>');
                                    });
                                });

                                md.convert.html(innerHtml);
                                md.convert.text("");

                                return innerHtml;
                            }
                            return this;
                        },
                        _string : function(variable, string) {
                            if (typeof string === 'undefined') {
                                return md.variable[variable];
                            } else {
                                md.variable[variable] = string;
                                return this;
                            }
                        },
                        text : function(text) { return md.convert._string("text", text); },
                        html : function(html) { return md.convert._string("html", html); },
                        inStack : function(tag) {
                            if (typeof tag === 'undefined') {
                                return (md.variable.stack.tag.length !== 0) ? true : false;
                            }

                            if (tag === "h" && md.convert.inStack()) {
                                if (md.variable.stack.tag[0].match(/^h[1-6]/)) {
                                    return true;
                                }
                            }
                            return ($.inArray(tag, md.variable.stack.tag) !== -1) ? true : false;
                        }
                    },
                    check : {
                        init  : function() {
                            md.vs = {};
                        },
                        valid : function(callmethod) {
                            if ('' !== md.convert.html()) {
                                return false;
                            }
                            if (md.convert.inStack() && !md.convert.inStack(callmethod)) {
                                return false;
                            }
                            return true;
                        },
                        _pre : function(i, v) {
                            return {
                                "nowv" : v,
                                "prev" : md.variable.editbody[i-1],
                                "nexv" : md.variable.editbody[i+1],
                                "tag"  : "",
                                "args" : false
                            };
                        },
                        isset : function(v) {
                            return (md.options.empty_mark !== v && "" !== v) ? true : false;
                        },
                        wrapper : function(callmethod, args) {
                            md.check.init();

                            if (md.check.valid(callmethod)) {
                                md.vs = md.check._pre.apply(this, args);
                            } else {
                                return false;
                            }
                            md.check.tags[callmethod].apply(this);

                            if (typeof md.vs.nexv === 'undefined' && md.convert.inStack()) {
                                md.convert.pop();
                            }
                        },
                        tags : {
                            h : function(args) {
                                /**
                                 *  # H1 Text - ###### H6 Text
                                 */
                                if (null !== md.vs.nowv.match(/^#{1,6}\s/)) {
                                    var tag  = "h" + md.vs.nowv.match(/^#{1,6}/)[0].length;
                                    var text = md.vs.nowv.replace(/^#{1,6}\s/, "")
                                    md.convert.push(tag, text).pop();
                                } else if (md.check.isset(md.vs.nowv) && md.vs.nexv) {
                                    /**
                                     *  H1 Text
                                     *  ================
                                     */
                                    if (md.vs.nexv.indexOf("=") === 0) {
                                        if ("" === md.vs.nexv.replace(/=/g, "")) {
                                            md.convert.push("h1", md.vs.nowv);
                                        }
                                    }

                                    /**
                                     *  H2 Text
                                     *  ----------------
                                     */
                                    if (md.vs.nexv.indexOf("-") === 0) {
                                        if ("" === md.vs.nexv.replace(/-/g, "")) {
                                            md.convert.push("h2", md.vs.nowv);
                                        }
                                    }
                                } else {
                                    md.convert.pop();
                                }
                            },
                            hr : function() {
                                if (md.vs.nowv.indexOf("-") === 0) {
                                    if (null !== md.vs.prev.match(/^#{1,6}\s/) || !md.check.isset(md.vs.prev)) {
                                        if ("" === md.vs.nowv.replace(/-/g, "")) {
                                            md.convert.push("hr").pop();
                                        }
                                    }
                                }
                                if (md.vs.nowv.indexOf("*") === 0) {
                                    if ("" === md.vs.nowv.replace(/\*/g, "")) {
                                        md.convert.push("hr").pop();
                                    }
                                }
                                if (md.vs.nowv.indexOf("_") === 0) {
                                    if ("" === md.vs.nowv.replace(/_/g, "")) {
                                        md.convert.push("hr").pop();
                                    }
                                }
                            },
                            a : function() {
                                if (null !== md.vs.nowv.match(/^!?\[.*\]\(.*\)$/)) {
                                    var alt = md.vs.nowv.replace(/^!?\[(.*)\]\(.*\)/, "$1");
                                    var src = md.vs.nowv.replace(/^!?\[.*\]\((.*)\)/, "$1").split(" ")[0];

                                    if (null !== md.vs.nowv.match(/^!/)) {
                                        var img = md.convert.push("img", src).push(alt).pop();
                                        var a   = md.convert.push("a", src).push(img).pop("target_blank");
                                    } else {
                                        a = md.convert.push("a", src).push(alt).pop();
                                    }
                                    md.convert.push("p", a).pop();
                                }
                            },
                            empty : function() {
                                if ("" === md.vs.nowv) {
                                    md.convert.push("empty").pop();
                                }
                            },
                            pre : function() {
                                if (md.vs.nowv.indexOf("```") !== -1) {
                                    (!md.convert.inStack("pre")) ?
                                        md.convert.push("pre", md.vs.nowv.replace(/`/g, "")):
                                        md.convert.pop();
                                } else if (md.convert.inStack("pre")) {
                                    md.convert.push(md.vs.nowv);
                                }
                            },
                            blockquote : function(args) {
                                if (md.vs.nowv.match(/^[\s{1,3}]?>\s?/)) {
                                    md.vs.nowv = md.vs.nowv.replace(/^[\s{1,3}]?>\s?/, "");
                                    md.convert.push("blockquote", md.vs.nowv);
                                } else if (!md.check.isset(md.vs.nowv)) {
                                    if (typeof md.vs.nexv !== 'undefined' && md.check.isset(md.vs.nexv)) {
                                        if (!md.vs.nexv.match(/^[\s{1,3}]?>/)) {
                                            md.convert.pop();
                                        }
                                    }
                                } else if (md.convert.inStack("blockquote")) {
                                    md.convert.push(md.vs.nowv);
                                }
                            },
                            p : function() {
                                if ((!md.vs.nowv.match(/^\s*?</) && md.vs.nowv !== "\n")) {
                                    if (!md.vs.nowv.match(/^\s*?</)) {
                                        if (!md.convert.inStack("p")) {
                                            md.convert.push("p");
                                        }

                                        if (typeof md.vs.nexv === 'undefined' ||
                                           (typeof md.vs.nexv !== 'undefined' && 
                                           ("" === md.vs.nexv || null !== md.vs.nexv.match(/^#{1,6}\s/))
                                           )) {
                                            md.convert.push(md.vs.nowv).pop();
                                        } else {
                                            md.convert.push(md.vs.nowv + '<br>');
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                md.variable.editbody = art_body.split(/\n/);

                var md_format = "";

                $.each(md.variable.editbody, function() {
                    var args = arguments;

                    $.each(md.check.tags, function(tagname) {
                        md.check.wrapper(tagname, args);
                    })
                    md_format += md.convert.html();
                    md.convert.html("");
                });
                return md_format;
            }

            var markdownconvert = "";

            $.each($(this), function(i, v) {
                markdownconvert += markdownConvert.apply(this, [$(v).val()]);
            });
            $(options.target_form).addClass("markdown-body").html(markdownconvert);

            return this;
        }
    });
})(jQuery);
