/*
jQuery.Markdown.js v0.0.1
Author: taknakamu
Git: https://github.com/taknakamu/jquery-markdown

Copyright (c) 2013 Kosuke Nakamuta
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/
(function ($) {
    $.fn.extend({
        markdown: function(options) {

            var defaults = {
                target_form : $(this).selector
            }
            options = $.extend(defaults, options);

            function markdownConvert(art_body) {
                var edit_body = art_body.split(/\n/);

                var edit_lock = false;
                var lang = "";
                var link = "";
                var no_p = false;
                var span_start = false;
                var add_p = false;

                var md_format = "";

                var empty_mark = "\n"; // "\n" or "<br>"

                $.each(edit_body, function(i, v) {
                    var nowv = v;
                    var prev = edit_body[i-1];
                    var nexv = edit_body[i+1];
                    var tmpv = "";

                    if (edit_lock) {
                        if (nowv.indexOf("```") !== -1) {
                            nowv = '</pre>\n';
                            edit_lock = false;
                        } else {
                            nowv = nowv + "\n";
                        }
                    } else {
                        if (nowv.indexOf("```") !== -1) {
                            edit_lock = true;
                            lang = nowv.replace(/`/g, "");

                            nowv = '<pre class="brush: ' + lang.toLowerCase() + ';">\n';
                        }

                        if (null !== nowv.match(/^#*\s/)) {
                            var count = nowv.match(/^#*/)[0].length;

                            nowv = nowv.replace(/^#*\s/, "");
                            nowv = '<h' + count + ' class="separator">' + nowv + '</h' + count + '>\n';

                            if (nexv && nexv.indexOf("-") === 0) {
                                tmpv = nexv.replace(/-/g, "");
                                if ("" === tmpv) {
                                    nowv += "<hr>\n";
                                    edit_body[i+1] = "";
                                }
                            }
                        }

                        if (null === nowv.match(/^#*\s/)) {
                            if (nexv && nexv.indexOf("=") === 0) {
                                tmpv = nexv.replace(/=/g, "");
                                if ("" === tmpv) {
                                    nowv = '<h1 class="separator">' + nowv + "</h1>\n";
                                }
                                edit_body[i+1] = "";
                            }
                        }

                        if (nexv && nexv.indexOf("-") === 0) {
                            if (empty_mark === nowv || "" === nowv) {
                                tmpv = nexv.replace(/-/g, "");
                                if ("" === tmpv) {
                                    nowv = "<hr>\n";
                                    edit_body[i+1] = "";
                                }
                            } else if (null === nowv.match(/^#*\s/)) {
                                tmpv = nexv.replace(/-/g, "");
                                if ("" === tmpv) {
                                    nowv = '<h2 class="separator">' + nowv + "</h2>\n";
                                    edit_body[i+1] = "";
                                }
                            }
                        }

                        if ("" === nowv) {
                            nowv = empty_mark;
                        }

                        if (null !== nowv.match(/^!?\[.*\]\(.*\)$/)) {
                            var alt = nowv.replace(/^!?\[(.*)\]\(.*\)/, "$1");
                            var src = nowv.replace(/^!?\[.*\]\((.*)\)/, "$1");

                            split_src = src.split(" ");
                            src = split_src[0];

                            var className = "";

                            if ("undefined" !== typeof split_src[1]) {
                                className = " " + split_src[1];
                            }

                            if (null !== nowv.match(/^!/)) {
                                nowv = '<a href="' + src + '" target="_blank"><img class="img-frame" style="max-width:100%;" src="' + src + '" alt="' + alt + '"/></a>';
                            } else {
                                nowv = '<a href="' + src + '">' + alt + '</a>';
                            }
                        }

                        if (nowv.match(/^\|span.*\|$/) || nowv.match(/^\|.*\|$/)) {
                            var span_num = nowv.replace(/^\|(.*)\|/, "$1");

                            if (!span_start) {
                                span_start = true;

                                nowv  = '<div class="row">\n';
                                nowv += '    <div class="' + span_num + '">';
                            } else {
                                if (span_num.match(/.*span.*/)) {
                                    nowv  = '    </div>\n';
                                    nowv += '    <div class="' + span_num + '">';
                                } else {
                                    nowv  = '    </div>\n';
                                    nowv += '</div>\n';
                                    span_start = false;
                                }
                            }
                        }

                        if (nowv.indexOf("<a") === 0 || (!nowv.match(/^\s*?</) && nowv !== empty_mark)) {
                            if (!add_p) {
                                nowv = "<p>" + nowv;
                            }

                            if (typeof nexv !== "undefined" && ("" === nexv || nexv.match(/^\|.*\|/))) {
                                nowv += "</p>\n";
                                add_p = false;
                            } else {
                                nowv += "<br>\n";
                                add_p = true;
                            }
                        }
                    }
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
