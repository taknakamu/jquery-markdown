/**
 *   jQuery.Markdown.js v0.0.1
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
                var add_p = block_start = false;

                var md = {
                    editbody : null,
                    vs       : {},
                    options : {
                        empty_mark : "\n" // "\n" or "<br>"
                    },
                    convert : {
                        tags : {
                            p   : function(v) {
                                return '<p>' + v + '</p>' + md.options.empty_mark;
                            },
                            ps  : function(v) { return "<p>" + v; },
                            pm  : function(v) { return v + "<br>" + md.options.empty_mark; },
                            pe  : function(v) { return v + "</p>" + md.options.empty_mark; },
                            h   : function(n, v) {
                                return '<h' + n + ' class="separator">' + v + '</h' + n + '>' + md.options.empty_mark;
                            },
                            h1 : function(v) { return md.convert.tags.h(1, v); },
                            h2 : function(v) { return md.convert.tags.h(2, v); },
                            h3 : function(v) { return md.convert.tags.h(3, v); },
                            h4 : function(v) { return md.convert.tags.h(4, v); },
                            h5 : function(v) { return md.convert.tags.h(5, v); },
                            h6 : function(v) { return md.convert.tags.h(6, v); },
                            hr : function(v) { return "<hr>" + md.options.empty_mark; },
                            empty_  : function(v) { return md.options.empty_mark; },
                            img : function(src, alt) {
                                return '<a href="' + src + '" target="_blank">' +
                                       '<img class="img-frame" style="max-width:100%;" src="' + src + '" alt="' + alt + '"/></a>';
                            },
                            a   : function(src, alt) {
                                return '<a href="' + src + '">' + alt + '</a>';
                            },
                            grids : function(v) {
                                return '<div class="row">' + md.options.empty_mark +
                                       '    <div class="' + v + '">';
                            },
                            gridm : function(v) {
                                return '    </div>' + md.options.empty_mark +
                                       '    <div class="' + v + '">';
                            },
                            gride : function(v) {
                                return '    </div>' + md.options.empty_mark +
                                       '</div>' + md.options.empty_mark;
                            },
                            blockquotes : function(v) { return '<blockquote>' + v;                      },
                            blockquotee : function(v) { return '</blockquote>' + md.options.empty_mark; },
                            blockquotem : function(v) { return v + md.options.empty_mark;               },
                            pres  : function(v) {
                                return '<pre class="brush: ' + v.toLowerCase() + ';">' + md.options.empty_mark;
                            },
                            prem  : function(v) { return v + md.options.empty_mark; },
                            pree  : function() { return '</pre>' + md.options.empty_mark; },
                            strong_ats : function(v) {
                                return v.replace(/\*\*/, "<strong>");
                            },
                            strong_ate : function(v) {
                                return v.replace(/\*\*/, "</strong>");
                            },
                            strong_uds : function(v) {
                                return v.replace(/__/, "<strong>");
                            },
                            strong_ude : function(v) {
                                return v.replace(/__/, "</strong>");
                            },
                            em1 : function(v) {
                                return v.replace(/\*(.*)\*/g, "<em>$1</em>") + md.options.empty_mark;
                            },
                            em2 : function(v) {
                                return v.replace(/_(.*)_/g, "<em>$1</em>") + md.options.empty_mark;
                            },
                            del : function(v) {
                                return v.replace(/~~(.*)~~/g, "<del>$1</del>") + md.options.empty_mark;
                            }
                        }
                    },
                    lock : {
                        pre  : false,
                        grid : false,
                        strong_at : false,
                        strong_ud : false
                    },
                    check : {
                        init  : function() {
                            md.vs = {};
                        },
                        valid : function() {
                            if (md.lock.pre) { return false; }
                            return true;
                        },
                        _pre : function(i, v) {
                            return {
                                "nowv" : v,
                                "prev" : md.editbody[i-1],
                                "nexv" : md.editbody[i+1],
                                "tag"  : "",
                                "args" : false
                            };
                        },
                        isset : function(v) {
                            return (md.options.empty_mark !== v && "" !== v) ? true : false;
                        },
                        wrapper : function(callmethod, args) {
                            md.check.init();

                            if (md.check.valid() || callmethod == "pre") {
                                md.vs = md.check._pre.apply(this, args);
                            } else {
                                return false;
                            }

                            if (!md.check.tags[callmethod](args)) {
                                return false;
                            }

                            if (typeof md.lock[md.vs.tag] !== 'undefined') {
                                if (!md.lock[md.vs.tag]) {
                                    md.lock[md.vs.tag] = true;
                                    md.vs.tag += 's';
                                } else {
                                    md.lock[md.vs.tag] = false;
                                    md.vs.tag += 'e';
                                }
                            }

                            var vsargs = (!md.vs.args) ? [md.vs.nowv] : md.vs.args;

                            try {
                                return md.convert.tags[md.vs.tag].apply(this, vsargs);
                            } catch(e) {
                                console.error(md.vs.tag + ' method is undefined');
                            }
                        },
                        tags : {
                            h : function(args) {
                                /**
                                 *  # H1 Text - ###### H6 Text
                                 */
                                if (null !== md.vs.nowv.match(/^#{1,6}\s/)) {
                                    md.vs.tag = "h" + md.vs.nowv.match(/^#{1,6}/)[0].length;
                                    md.vs.nowv = md.vs.nowv.replace(/^#{1,6}\s/, "");
                                } else if (md.check.isset(md.vs.nowv) && md.vs.nexv) {
                                    /**
                                     *  H1 Text
                                     *  ================
                                     */
                                    if (md.vs.nexv.indexOf("=") === 0) {
                                        if ("" === md.vs.nexv.replace(/=/g, "")) {
                                            md.vs.tag = "h1";
                                            md.editbody[args[0]+1] = "";
                                        }
                                    }

                                    /**
                                     *  H2 Text
                                     *  ----------------
                                     */
                                    if (md.vs.nexv.indexOf("-") === 0) {
                                        if ("" === md.vs.nexv.replace(/-/g, "")) {
                                            md.vs.tag = "h2";
                                            md.editbody[args[0]+1] = "";
                                        }
                                    }
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            hr : function() {
                                if (md.vs.nowv.indexOf("-") === 0) {
                                    if (null !== md.vs.prev.match(/^#{1,6}\s/) || !md.check.isset(md.vs.prev)) {
                                        if ("" === md.vs.nowv.replace(/-/g, "")) {
                                            md.vs.tag = "hr";
                                        }
                                    }
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            a : function() {
                                if (null !== md.vs.nowv.match(/^!?\[.*\]\(.*\)$/)) {
                                    var alt = md.vs.nowv.replace(/^!?\[(.*)\]\(.*\)/, "$1");
                                    var src = md.vs.nowv.replace(/^!?\[.*\]\((.*)\)/, "$1")
                                                         .split(" ")[0];

                                    if (null !== md.vs.nowv.match(/^!/)) {
                                        md.vs.tag = "img";
                                    } else {
                                        md.vs.tag = "a";
                                    }
                                    md.vs.args = [src, alt];
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            grid : function() {
                                if (md.vs.nowv.match(/^\|span.*\|$/) || md.vs.nowv.match(/^\|.*\|$/)) {
                                    md.vs.nowv = md.vs.nowv.replace(/^\|(.*)\|/, "$1");
                                    md.vs.tag = "grid";

                                    if (md.lock.grid && md.vs.nowv.match(/.*span.*/)) {
                                        md.vs.tag = "gridm";
                                    }
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            empty_ : function() {
                                if ("" === md.vs.nowv) {
                                    md.vs.tag = "empty_";
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            pre : function() {
                                if (md.vs.nowv.indexOf("```") !== -1) {
                                    md.vs.tag = "pre";
                                    md.vs.args = [md.vs.nowv.replace(/`/g, "")];
                                } else if (md.lock.pre) {
                                    md.vs.tag = "prem";
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            blockquote : function(args) {
                                if (md.vs.nowv.match(/^[\s{1,3}]?>\s?/)) {
                                    md.vs.nowv = md.vs.nowv.replace(/^[\s{1,3}]?>\s?/, "");

                                    if (!block_start) {
                                        md.vs.tag = "blockquotes";
                                    } else {
                                        md.vs.tag = "blockquotem";
                                    }

                                    var tmpv = false;

                                    $.each(md.check.tags, function(tagname) {
                                        if (tagname === "blockquote") {
                                            return;
                                        }

                                        if ((tmpv = md.check.wrapper(tagname, [args[0], md.vs.nowv]))) {
                                            md.vs.nowv = tmpv;
                                        }
                                    });
                                    block_start = true;
                                } else if (block_start) {
                                    if (md.check.isset(md.vs.nowv)) {
                                        return false;
                                    }

                                    if (!md.vs.nexv.match(/^[\s{1,3}]?>/)) {
                                        block_start = false;
                                        md.vs.tag = "blockquotee";
                                    }
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            p : function() {
                                if ((!md.vs.nowv.match(/^\s*?</) && md.vs.nowv !== "\n")) {
                                    if (!md.vs.nowv.match(/^\s*?</)) {
                                        if (!add_p) {
                                            md.vs.tag = "ps";
                                            md.vs.nowv = md.convert.tags[md.vs.tag](md.vs.nowv);
                                        }

                                        if (typeof md.vs.nexv !== "undefined" && ("" === md.vs.nexv || md.vs.nexv.match(/^\|.*\|/))) {
                                            md.vs.tag = "pe";
                                            add_p = false;
                                        } else {
                                            md.vs.tag = "pm";
                                            add_p = true;
                                        }
                                    }
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            strong_at : function() {
                                if (!md.lock.strong_at && md.vs.nowv.match(/\*\*/)) {
                                    md.vs.tag = "strong_ats";
                                    md.vs.nowv = md.convert.tags[md.vs.tag](md.vs.nowv);
                                    md.lock.strong_at = true;
                                }

                                if (md.lock.strong_at && md.vs.nowv.match(/\*\*/)) {
                                    md.vs.tag = "strong_ate";
                                    md.vs.nowv = md.convert.tags[md.vs.tag](md.vs.nowv);
                                    md.lock.strong_at = false;
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            strong_ud : function() {
                                if (!md.lock.strong_ud && md.vs.nowv.match(/__/)) {
                                    md.vs.tag = "strong_uds";
                                    md.vs.nowv = md.convert.tags[md.vs.tag](md.vs.nowv);
                                    md.lock.strong_ud = true;
                                }

                                if (md.lock.strong_ud && md.vs.nowv.match(/__/)) {
                                    md.vs.tag = "strong_ude";
                                    md.vs.nowv = md.convert.tags[md.vs.tag](md.vs.nowv);
                                    md.lock.strong_ud = false;
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            em1 : function() {
                                if (md.vs.nowv.match(/\*.*\*/)) {
                                    md.vs.tag = "em1";
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            em2 : function() {
                                if (md.vs.nowv.match(/_.*_/)) {
                                    md.vs.tag = "em2";
                                }
                                return (md.vs.tag !== "") ? true : false;
                            },
                            del : function() {
                                if (md.vs.nowv.match(/~~.*~~/)) {
                                    md.vs.tag = "del";
                                }
                                return (md.vs.tag !== "") ? true : false;
                            }
                        }
                    }
                };

                md.editbody = art_body.split(/\n/);

                var md_format = "";

                $.each(md.editbody, function(i, nowv) {
                    var tmpv = "";
                    var args = arguments;

                    $.each(md.check.tags, function(tagname) {
                        if ((tmpv = md.check.wrapper(tagname, args))) {
                            nowv = tmpv;
                        }
                    })
                    md_format += nowv;
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
