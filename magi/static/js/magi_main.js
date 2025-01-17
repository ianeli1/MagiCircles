
// *****************************************
// Variables

let no_result_div = (
    '<div class="padding50 no-result-wrapper"><h4 class="padding50 alert alert-info no-result-alert">'
        + gettext('No result.') + '</h4></div>');

// *****************************************
// *****************************************
// Always called

// *****************************************
// Auto load forms

function disableButton(button) {
    button.unbind('click');
    button.click(function(e) {
        e.preventDefault();
        return false;
    });
}

function reenableButton(button) {
    button.unbind('click');
    if (button.data('previous-content')) {
        button.html(button.data('previous-content'));
    }
    formloaders();
}

function formloaders() {
    $('button[data-form-loader=true]').closest('form').attr('novalidate', true);
    $('button[data-form-loader=true]').click(function(e) {
        $(this).data('previous-content', $(this).html());
        $(this).html('<i class="flaticon-loading"></i>');
        disableButton($(this));
    });
}

function deleteFormConfirm() {
    let form = $('form[data-form-name^="delete_"]:not(.handled)');
    if (form.length > 0) {
        if (!show_cascade_before_delete) {
            return;
        }
        form.addClass('handled');
        let thing_to_delete = form.data('form-name').substring(7);
        let id_thing_to_delete = form.find('[name=thing_to_delete]').val();
        if (form.closest('.modal').length > 0) {
            // When loaded in a modal, just replace form with link
            let title = form.closest('.modal').find('h1[id="' + form.data('form-name') + '"]');
            form.replaceWith('<br><br><div class="text-center"><a href="/' + thing_to_delete + '/edit/'+ id_thing_to_delete + '/#delete_' + thing_to_delete + '">' + title.html() + '</a></div>');
            title.hide();
        } else {
            // When loaded in its own page
            // Prevent submit to show warning
            form.off('submit');
            form.submit(function(e) {
                let checkbox = form.find('[name="confirm"]');
                if (!checkbox.prop('checked')) {
                    return;
                }
                e.preventDefault();
                $.ajax({
                    url: '/ajax/whatwillbedeleted/' + thing_to_delete + '/' + id_thing_to_delete + '/',
                    success: function(html) {
                        confirmModal(function() { // on confirmed
                            form.off('submit');
                            form.submit();
                        }, function() { // on cancelled
                            checkbox.prop('checked', false);
                            reenableButton(form.find('[type=submit]'));
                            return false;
                        }, undefined, html);
                    },
                });
            });
        }
    }
}

// *****************************************
// Color picker

function colorPicker() {
    $('input[type="color"]').unbind('change');
    $('input[type="color"]').change(function(e) {
        let checkbox = $('input[type="checkbox"][name="unset-' + $(this).prop('id').slice(3) + '"]');
        if (checkbox.length > 0) {
            checkbox.prop('checked', false);
        }
    });
}

// *****************************************
// Smooth page scroll

function loadPageScroll() {
    $('a.page-scroll').unbind('click');
    $('a.page-scroll').bind('click', function(event) {
        let anchor = $(this);
        let destination;
        if (anchor.data('destination')) {
            destination = $('[id="' + anchor.data('destination') + '"]');
        } else {
            destination = $(anchor.attr('href'));
        }
        $('html, body').stop().animate({
            scrollTop: destination.offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
}

// *****************************************
// Date input support

function dateInputSupport() {
    // Auto set timezone
    $('[data-auto-change-timezone]:not(.loaded-auto-change-timezone)').each(function() {
        let timezone_input = $(this);
        timezone_input.addClass('loaded-auto-change-timezone');
        let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone && timezone_input.find('option[value="' + timezone + '"]').length > 0) {
            timezone_input.val(timezone);
        }
    });

    // Auto convert to timezone (from value in UTC)
    $('[data-auto-convert-to-timezone]:not(.loaded-auto-convert-to-timezone)').each(function() {
        let time_input = $(this);
        time_input.addClass('loaded-auto-convert-to-timezone');
        let timezone_value = time_input.closest('form').find(
            '[name="' + time_input.prop('name').slice(0, -5) + '_timezone"]').val();
        let time_value = time_input.val();
        if (typeof time_value != 'undefined' && time_value != ''
            && typeof timezone_value != 'undefined' && timezone_value != '') {
            let date_value = time_input.closest('form').find(
                '[name="' + time_input.prop('name').slice(0, -5) + '"]').val();
            if (typeof date_value == 'undefined' || date_value == '') {
                date_value = (new Date()).toISOString().split('T')[0];
            }
            let utc_date = new Date(date_value + 'T' + time_value + '.000Z');
            let new_time = utc_date.toLocaleString('en-GB', { timeZone: timezone_value }).slice(-8);
            if (time_input.is('select') && time_input.find('option[value="' + new_time + '"]').length == 0) {
                time_input.append('<option value="' + new_time + '">' + new_time + '</option>');
            }
            time_input.val(new_time);
        }
    });

    // If date input is supported, hide help text (string format)
    if ($('input[type="date"]').length > 0) {
        var input = document.createElement('input');
        input.setAttribute('type', 'date');
        if (input.type == 'date') {
            $('input[type="date"]:not(.loaded-hide-help-text)').each(function() {
                $(this).addClass('loaded-hide-help-text');
                $(this).parent().find('.help-block .format-help').hide();
            });
        }
    }
}

// *****************************************
// Hide Staff Buttons

var staff_buttons_hidden = true;

function hideStaffButtons(show) {
    if (show) {
        $('.staff-only').show();
        $('.staff-only').closest('.btn-group').each(function () {
            $(this).find('.btn:not(.staff-only)').last().css('border-top-right-radius', 0).css('border-bottom-right-radius', 0);
        })
        staff_buttons_hidden = false;
    } else {
        $('.staff-only').hide();
        $('.staff-only').closest('.btn-group').each(function () {
            var radius = $(this).find('.btn:not(.staff-only)').first().css('border-top-left-radius');
            $(this).find('.btn:not(.staff-only)').last().css('border-top-right-radius', radius).css('border-bottom-right-radius', radius);
        })
        staff_buttons_hidden = true;
    }
}

function loadStaffOnlyButtons() {
    let button = $('a[href="#hideStaffButtons"]');
    if ($('.staff-only').length < 1) {
        button.hide();
        return;
    }
    button.show();
    hideStaffButtons(!staff_buttons_hidden);
    button.unbind('click');
    button.click(function(e) {
        e.preventDefault();
        hideStaffButtons(staff_buttons_hidden);
        $(this).blur();
        return false;
    });
}

// *****************************************
// Corner popups

function loadCornerPopups() {
    $('.corner-popup').each(function() {
        let popup = $(this);
        let last_reminder = localStorage['popovers_' + popup.data('name') + '_last_reminder'] || null;
        let remind_in_days = $('a[href="#close_remind"]').data('reminder-in-days');
        let always_close = localStorage['popovers_' + popup.data('name') + '_always_close'] || false;
        if (always_close
            || (last_reminder && remind_in_days &&
                last_reminder > (new Date().getTime() - (remind_in_days * 24 * 60 * 60 * 1000)))) {
            popup.remove();
        } else {
            $.each(['close', 'close_remind', 'close_forever'], function(i, cls) {
                let button = popup.find('a[href="#' + cls + '"]');
                if (button.length) {
                    button.unbind('click');
                    button.click(function(e) {
                        e.preventDefault();
                        if (cls == 'close_remind') {
                            localStorage['popovers_' + popup.data('name') + '_last_reminder'] = new Date().getTime();
                        } else if (cls == 'close_forever') {
                            localStorage['popovers_' + popup.data('name') + '_always_close'] = true;
                        }
                        popup.hide('fast', function() {
                            popup.remove();
                            // Show next popup if any
                            $('.corner-popup').first().show('fast');
                        });
                        return false;
                    });
                }
            });
        }
    });
    $('.corner-popup').first().show();
}

// *****************************************
// Notifications

function notificationsHandler() {
    var button = $('a[href="/notifications/"]');
    var world = button.find('.flaticon-notification');
    var loader = button.find('.flaticon-loading');
    var badge = button.find('.badge');
    if (badge.length > 0 && $(document).width() > 992) {
        var onClick = function(e) {
            e.preventDefault();
            button.unbind('click');
            world.hide();
            loader.show();
            $.ajax({
                'url': '/ajax/notifications/?ajax_modal_only&page_size=2',
                'success': function(data) {
                    var onShown = function() {
                        var remaining = $('nav.navbar ul.navbar-right .popover span.remaining').text();
                        if (remaining != '') {
                            badge.text(remaining);
                            badge.show();
                        } else {
                            button.unbind('click');
                        }
                    };
                    loader.hide();
                    badge.hide();
                    world.show();
                    if ($('nav.navbar ul.navbar-right .popover').is(':visible')) {
                        $('nav.navbar ul.navbar-right .popover .popover-content').html(data);
                        onShown();
                    } else {
                        button.popover({
                            container: $('nav.navbar ul.navbar-right'),
                            html: true,
                            placement: 'bottom',
                            content: data,
                            trigger: 'manual',
                        });
                        button.popover('show');
                        button.on('shown.bs.popover', function () {
                            onShown();
                        });
                    }
                },
                'error': genericAjaxErrorWithCallback(function() {
                    loader.hide();
                    world.show();
                    badge.hide();
                }),
            });
            return false;
        };
        button.click(onClick);
    }
}

// *****************************************
// Ajax modals

function ajaxModals() {
    $('[data-ajax-url]').each(function() {
        var button = $(this);
        var modalButtons = 0;
        if (button.data('ajax-show-button') == true) {
            modalButtons = undefined;
        }
        button.unbind('click');
        button.click(function(e) {
            var button_display = button.css('display');
            if (button_display == 'inline') {
                button.css('display', 'inline-block');
            }
            var button_height = button.height();
            var button_width = button.width();
            var button_content = button.html();
            button.html('<div class="text-center"><i class="flaticon-loading"></i></div>');
            var loader_wrapper = button.find('div');
            loader_wrapper.height(button_height);
            loader_wrapper.width(button_width);
            var loader = button.find('.flaticon-loading');
            let smaller = button_height < button_width ? button_height : button_width;
            loader.height(smaller);
            loader.width(smaller);
            loader.css('line-height', smaller + 'px');
            loader.css('font-size', (smaller - (smaller * 0.4)) + 'px');
            $.ajax({
                'url': button.data('ajax-url'),
                'success': function(data) {
                    // If it's a full page, redirect to page because it can't be included in a modal
                    if (data && data.indexOf('<!DOCTYPE html>') !== -1) {
                        window.location.href = button.data('ajax-url').replace('/ajax/', '/');
                        return false;
                    }
                    button.css('display', button_display);
                    button.html(button_content);
                    var title = button.data('ajax-title');
                    title = typeof title == 'undefined' ? button_content : title;
                    if (data && data.indexOf('<h1 class="page-title ') !== -1) {
                        data = $('<div>' + data + '</div>');
                        title = data.find('h1.page-title').first().html();
                        data.find('h1.page-title').first().remove();
                    }
                    modal_size = button.data('ajax-modal-size');
                    freeModal(title, data, modalButtons, modal_size, $('#ajaxModal'));
                    if (typeof button.attr('href') != 'undefined') {
                        $('#ajaxModal').data('original-url', button.attr('href'));
                    }
                    loadCommons();
                    if (typeof button.data('ajax-handle-form') != 'undefined') {
                        var ajaxModals_handleForms;
                        ajaxModals_handleForms = function() {
                            formloaders();
                            $('#ajaxModal form').submit(function(e) {
                                e.preventDefault();
                                var form_name = $(this).find('.generic-form-submit-button').attr('name');
                                $(this).ajaxSubmit({
                                    context: this,
                                    success: function(data) {
                                        var form_modal_size = modal_size;
                                        if (typeof form_name != 'undefined'
                                            && $(data).find('form .generic-form-submit-button[name="' + form_name + '"]').length == 0
                                            && $(data).find('form .errorlist').length == 0
                                            && typeof button.data('ajax-modal-after-form-size') != 'undefined') {
                                            form_modal_size = button.data('ajax-modal-after-form-size');
                                        }

                                        if (data && data.indexOf('<h1 class="page-title ') !== -1) {
                                            data = $('<div>' + data + '</div>');
                                            title = data.find('h1.page-title').first().html();
                                            data.find('h1.page-title').first().remove();
                                        }

                                        freeModal(title, data, modalButtons, form_modal_size, $('#ajaxModal'));
                                        if (typeof form_name != 'undefined'
                                            && $('#ajaxModal form .generic-form-submit-button[name="' + form_name + '"]').length > 0
                                            && $('#ajaxModal form .errorlist').length > 0) {
                                            ajaxModals_handleForms();
                                        }
                                        loadCommons();
                                    },
                                    error: genericAjaxError,
                                });
                                return false;
                            });
                        };
                        ajaxModals_handleForms();
                    }
                },
                'error': genericAjaxErrorWithCallback(function() {
                    button.css('display', button_display);
                    button.html(button_content);
                }),
            });
            return false;
        });
    });
}

// *****************************************
// Ajax popovers

function ajaxPopovers() {
    $('[data-ajax-popover]').each(function() {
        var button = $(this);
        button.unbind('click');
        button.click(function(e) {
            e.preventDefault();
            var popover = button.data('bs.popover');
            if (!popover) {
                if (button.popover)
                    button.popover({
                        content: '<i class="flaticon-loading"></i>',
                        html: true,
                        container: 'body',
                        trigger: 'manual',
                        placement: 'bottom',
                    });
                button.popover('show');
                popover = button.data('bs.popover');
                $.ajax({
                    'url': button.data('ajax-popover'),
                    'success': function(data) {
                        popover.options.content = data;
                        button.on('shown.bs.popover', function() {
                            loadCommons();
                        });
                        button.popover('show');
                    },
                    'error': genericAjaxError,
                });
            } else {
                button.popover('show');
            }
        });
    });
}

// *****************************************
// Load HD images

function loadHDImages() {
    if ($(document).width() > 992) {
        $('img[data-hd-src]').each(function() {
            let image = $(this);
            // Don't load HD images for items included in activities
            if (image.closest('.activity').length < 1) {
                let hd = image.data('hd-src');
                if (hd && hd != '' && hd != 'None' && image.attr('src') != hd) {
                    image.prop('src', hd);
                    console.log('Loading HD image', hd);
                }
            }
        });
    }
}

// *****************************************
// Load images with links

function loadImagesWithLinks() {
    $('.image-with-links:not(.loaded)').each(function() {
        let div = $(this);
        div.addClass('loaded');
        let title = div.find('h4').remove();
        let content = div.html();
        div.empty();
        div.css('background-image', 'url(' + div.data('thumbnail') + ')');
        div.css('cursor', 'pointer');
        div.css('height', 190);
        div.css('width', 190);
        div.css('max-width', '100%');
        div.popover({
            html: true,
            placement: 'left',
            title: title,
            content: content,
            trigger: 'manual',
        });
        div.click(function(e) {
            e.preventDefault();
            div.popover('show');
            return false;
        });
    });
}

// *****************************************
// Load ranges

function loadRanges() {
    function _showValue() {
        let input = $(this);
        let formGroup = input.closest('.form-group');
        let rangeValue = formGroup.find('.range-value');
        let value = (input.data('show-value-prefix') || '') + input.val() + (input.data('show-value-suffix') || '');
        if (rangeValue.length > 0) {
            rangeValue.text(value);
        } else {
            formGroup.append('<div class="text-right range-value">' + value + '</div>');
            //rangeValue = formGroup.find('.range-value');
        }

    }
    $('input[data-show-value=true]').each(_showValue);
    $('input[data-show-value=true]').on('input', _showValue);
}

// *****************************************
// Load countdowns

function _loadCountdowns() {
    $('.countdown').each(function() {
        var elt = $(this);
        var format = typeof elt.data('format') != undefined ? elt.data('format') : '{time}';
        elt.countdown({
            date: elt.data('date'),
            render: function(data) {
                $(this.el).text(format.replace('{time}', data.days + ' ' + gettext('days') + ' ' + data.hours + ' ' + gettext('hours') + ' ' + data.min + ' ' + gettext('minutes') + ' ' + data.sec + ' ' + gettext('seconds')));
            },
        });
    });
}

function loadCountdowns() {
    if ($('.countdown').length > 0) {
        if (typeof Countdown == 'undefined') {
            $.getScript(static_url + 'bower/countdown/dest/jquery.countdown.min.js', _loadCountdowns);
        } else {
            _loadCountdowns();
        }
    }
}

// *****************************************
// Load timezone dates

function _loadTimezones() {
    $('.timezone').each(function() {
        var elt = $(this);
        if (elt.data('converted') == true) {
            return;
        }
        elt.data('converted', true);
        var date = new Date(elt.find('.datetime').text());
        var timezone = elt.data('to-timezone');
        var options = {
            year: elt.data('year-format') || (elt.data('hide-year') ? undefined : 'numeric'),
            month: elt.data('month-format') || (elt.data('hide-month') ? undefined : 'long'),
            day: elt.data('day-format') || (elt.data('hide-day') ? undefined : 'numeric'),
            hour: elt.data('hour-format') || (elt.data('hide-hour') ? undefined : 'numeric'),
            minute: elt.data('minute-format') || (elt.data('hide-minute') ? undefined : 'numeric'),
        };
        if (typeof timezone != 'undefined' && timezone != '' && timezone != 'Local time') {
            options['timeZone'] = timezone;
        } else {
            timezone = 'Local time';
        }
        var converted_date = date.toLocaleString($('html').attr('lang'), options);
        elt.find('.datetime').text(converted_date);
        elt.find('.current_timezone').text(gettext(timezone));
        if (typeof elt.data('timeago') != 'undefined') {
            var html = elt.html();
            elt.html(jQuery.timeago(date));
            elt.tooltip({
                html: true,
                title: html,
                trigger: 'hover',
            });
        }
        elt.show();
    });
}

function _localeNameToTimeAgoLocaleName() {
    let locale = $('html').attr('lang');
    let to_locale = {
        'zh-hans': 'zh-CN',
        'zh-hant': 'zh-TW',
    }[locale];
    return to_locale ? to_locale : locale;
}

function loadTimezones() {
    if ($('[data-timeago]').length > 0 && typeof jQuery.timeago == 'undefined') {
        $.getScript(static_url + 'bower/jquery-timeago/jquery.timeago.js', function() {
            $.getScript(static_url + 'bower/jquery-timeago/locales/jquery.timeago.' +  _localeNameToTimeAgoLocaleName() + '.js', function() {
                jQuery.timeago.settings.allowPast = true;
                jQuery.timeago.settings.allowFuture = true;
                _loadTimezones();
            });
        });
    } else {
        _loadTimezones();
    }
}

// *****************************************
// On back button close modal

var realBack = false;
var calledBack = false;

function onBackButtonCloseModal() {
    let originalHeadTitle = $('head title').text();
    let originalHeadDescription = $('head meta[name="description"]').first().prop('content');
    $('#ajaxModal').on('shown.bs.modal', function()  {
        var urlReplace;
        var original_url = $(this).data('original-url');
        if (typeof original_url != 'undefined') {
            urlReplace = original_url;
        } else {
            urlReplace = '#' + $(this).attr('id');
        }
        history.pushState(null, null, urlReplace);
        let headTitleInModal = $('#ajaxModal .head-for-modal .head-for-modal-title').text();
        let headDescriptionInModal = $('#ajaxModal .head-for-modal head-for-modal-description').text();
        if (typeof headTitleInModal != 'undefined') {
            $('head title').text(headTitleInModal);
        }
        if (typeof headDescriptionInModal) {
            $('head meta[name="description"]').prop('content', headTitleInModal);
        }
    });

    $('#ajaxModal').on('hidden.bs.modal', function()  {
        if (realBack == false) {
            calledBack = true;
            history.back();
        } else {
            realBack = false;
        }
        $('head title').text(originalHeadTitle);
        $('head meta[name="description"]').prop('content', originalHeadDescription);
    });
    $(window).on('popstate', function() {
        if (calledBack == false) {
            realBack = true;
        }
        calledBack = false;
        $('#ajaxModal').modal('hide');
    });
}

// *****************************************
// Side bar toggle button

function sideBarToggleButton() {
    $('#togglebutton, .togglebutton').click(function(e) {
        e.preventDefault();
        $('#wrapper').toggleClass('toggled');
        $(this).blur();
    });
}

// *****************************************
// Side bar search help text

function sideBarSearchHelpText() {
    let search_input = $('#sidebar-wrapper input#id_search');
    let help_text = search_input.closest('.form-group').find('.help-block');
    help_text.hide();
    search_input.focus(function(e) {
        help_text.show('fast');
    });
    search_input.blur(function(e) {
        help_text.hide('fast');
    });
}

// *****************************************
// Switch language

function switchLanguage() {
    $('#switchLanguage + .cuteform img').click(function() {
        $(this).closest('form').submit();
    });
}

// *****************************************

// uniquePerOwner can also be set in data-unique-per-owner
function directAddCollectible(buttons, uniquePerOwner) {
    buttons.unbind('click');
    buttons.each(function() {
        var button = $(this);
        var form_url = button.data('ajax-url');
        var add_to_id = button.data('quick-add-to-id');
        var fk_as_owner = button.data('quick-add-to-fk-as-owner');
        if (form_url.indexOf('/add/') < 0) {
            return;
        }
        button.removeAttr('data-ajax-url');
        button.click(function(e) {
            e.preventDefault();
            if (button.find('.flaticon-loading').length > 0) {
                return;
            }
            var button_content = button.html();
            if (!(typeof uniquePerOwner !== 'undefined' ? uniquePerOwner : button.data('unique-per-owner') === true)
                || button.find('.badge').text() === '0') {
                // Add
                button.html('<i class="flaticon-loading"></i>');
                $.ajax({
                    'url': form_url,
                    'success': function(data) {
                        var form = $(data).find('form');
                        if (typeof add_to_id !== 'undefined') {
                            form.find('#id_' + fk_as_owner).val(add_to_id);
                        }
                        form.ajaxSubmit({
                            success: function(data) {
                                button.html(button_content);
                                if ($(data).find('.success').length > 0) {
                                    button.find('.badge').text(parseInt(button.find('.badge').text()) + 1);
                                    var alt_message = button.data('alt-message');
                                    if (alt_message) {
                                        button.data('alt-message', button.find('.message').text().trim());
                                        button.find('.message').text(alt_message);
                                        button.prop('title', alt_message);
                                        if (button.data('toggle') == 'tooltip') {
                                            button.tooltip('fixTitle');
                                        }
                                        button.data('original-title', alt_message);
                                    }
                                    button.find('.badge').show();
                                    if (button.data('toggle') == 'tooltip') {
                                        button.tooltip('hide');
                                    }
                                }
                                else {
                                    genericAjaxError({ responseText: 'Error' });
                                }
                            },
                            error: genericAjaxError,
                        });
                    },
                    'error': genericAjaxErrorWithCallback(function() {
                        button.html(button_content);
                    }),
                });
            } else {
                // Delete
                button.html('<i class="flaticon-loading"></i>');
                $.ajax({
                    'url': '/ajax/' + button.data('btn-name') + '/edit/unique/?' + button.data('parent-item-field-name-id') + '=' + button.data('parent-item-id') + (fk_as_owner ? ('&' + fk_as_owner + '=' + add_to_id) : ''),
                    'success': function(data) {
                        var form = $(data).find('form[data-form-name^="delete_"]');
                        form.find('#id_confirm').prop('checked', true);
                        form.ajaxSubmit({
                            success: function(data) {
                                button.html(button_content);
                                if ($(data).find('.success').length > 0) {
                                    button.find('.badge').text(parseInt(button.find('.badge').text()) - 1);
                                    var alt_message = button.data('alt-message');
                                    if (alt_message) {
                                        button.data('alt-message', button.find('.message').text());
                                        button.find('.message').text(alt_message);
                                        button.prop('title', alt_message);
                                        if (button.data('toggle') == 'tooltip') {
                                            button.tooltip('fixTitle');
                                        }
                                        button.data('original-title', alt_message);
                                    }
                                    button.find('.badge').hide();
                                    if (button.data('toggle') == 'tooltip') {
                                        button.tooltip('hide');
                                    }
                                }
                                else {
                                    genericAjaxError({ responseText: 'Error' });
                                }
                            },
                            error: genericAjaxError,
                        });
                    },
                    'error': genericAjaxErrorWithCallback(function() {
                        button.html(button_content);
                    }),
                });
            }
        });
    });
}

// *****************************************
// Translations see all buttons

function translationsSeeAll() {
    let buttons_wrapper = $('.languages-buttons');
    if (buttons_wrapper.length > 0) {
        let form = buttons_wrapper.closest('form');
        let spoken_languages_string = buttons_wrapper.data('spoken-languages');
        let spoken_languages = spoken_languages_string == "" ? [] : spoken_languages_string.split(',');
        let buttons = buttons_wrapper.find('a');
        let all_button = buttons_wrapper.find('a[href="#translations_see_all"]');
        function _showLanguage(language) {
            form.find(
                '[id^="id_d_"][id$="-'
                    + language + '"], [id^="id_"][data-language="'
                    + language + '"]'
            ).closest('.form-group').show();
        }
        buttons_wrapper.show();
        if (spoken_languages.length > 0) {
            function _toggleAll() {
                let toggled = all_button.hasClass('toggled');
                if (toggled) {
                    form.find('.form-group').show();
                    buttons.show();
                } else {
                    buttons.hide();
                    all_button.show();
                    $.each(spoken_languages, function(i, language) {
                        _showLanguage(language);
                    });
                }
            }
            buttons.hide();
            all_button.show();
            form.find('.form-group').hide();
            _toggleAll();
            buttons.unbind('click');
            buttons.click(function(e) {
                e.preventDefault();
                let button = $(this);
                // Hide all
                form.find('.form-group').hide();
                // On click button all languages / only spoken languages
                if (button.attr('href') == '#translations_see_all') {
                    if (button.hasClass('toggled')) {
                        button.removeClass('toggled');
                        button.text('See all languages');
                    } else {
                        button.addClass('toggled');
                        button.html(
                            'See only the languages you speak ' +
                                spoken_languages.map(function(language) {
                                    return '<img src="' + static_url + 'img/language/' + language + '.png" width="20">';
                                }).join('')
                        );
                    }
                    _toggleAll();
                } else if (button.attr('href') == '#translations_see_language') {
                    _showLanguage(button.data('language'));
                }
                return false;
            });
        } else {
            buttons.show();
            all_button.hide();
            buttons.click(function(e) {
                e.preventDefault();
                let button = $(this);
                if (button.attr('href') == '#translations_see_all') {
                    all_button.hide();
                    form.find('.form-group').show();
                } else if (button.attr('href') == '#translations_see_language') {
                    all_button.show();
                    form.find('.form-group').hide();
                    _showLanguage(button.data('language'));
                }
                return false;
            });
        }
    }
}

// *****************************************
// Items reloaders

function itemsReloaders() {
    if (typeof ids_to_reload != 'undefined') {
        $.each(reload_urls_start_with, function(index, url_start_with) {
            $('[href^="' + url_start_with + '"]:not(.reload-handler)').click(function(e) {
                var item_id = $(this).closest('[data-item-id]').data('item-id');
                ids_to_reload.push(item_id);
                $(this).addClass('reload-handler');
            });
        });
    }
    if (typeof reload_item != 'undefined') {
        $.each(reload_urls_start_with, function(index, url_start_with) {
            $('[href^="' + url_start_with + '"]:not(.reload-item-handler)').click(function(e) {
                reload_item = true;
                $(this).addClass('reload-item-handler');
            });
        });
    }
}

var reloaderLocation;

function modalItemsReloaders() {
    if (typeof ids_to_reload != 'undefined') {
        reloaderLocation = location.search;
        $('.modal').on('hidden.bs.modal', function(e) {
            ids_to_reload = $.unique(ids_to_reload);
            if (ids_to_reload.length > 0) {
                $.ajax({
                    'url': (
                        ajax_reload_url + reloaderLocation
                            + (reloaderLocation == '' ? '?' : '&')
                            + 'ids=' + ids_to_reload.join(',')
                            + '&page_size=' + ids_to_reload.length
                    ),
                    'success': function(data) {
                        var html = $(data);
                        $.each(ids_to_reload, function(index, id) {
                            var previous_item = $('[data-item="' + reload_data_item + '"][data-item-id="' + id + '"]');
                            var new_item = html.find('[data-item="' + reload_data_item + '"][data-item-id="' + id + '"]');
                            if (new_item.length == 0) {
                                // If not returned, remove it
                                previous_item.remove();
                            } else {
                                // Replace element
                                previous_item.replaceWith(new_item);
                            }
                        });
                        ids_to_reload = [];
                        if (ajax_pagination_callback) {
                            ajax_pagination_callback();
                        }
                        loadCommons();
                    },
                    'error': genericAjaxError,
                });
            }
        });
    }
    if (typeof reload_item != 'undefined') {
        $('.modal').on('hidden.bs.modal', function(e) {
            if (reload_item === true) {
                $.ajax({
                    'url': ajax_reload_url,
                    'success': function(data) {
                        $('.item-container').html(data);
                        reload_item = false;
                        loadCommons();
                    },
                    'error': genericAjaxError,
                });
            }
        });
    }
}

// *****************************************
// Dismiss popovers on click outside

function dismissPopoversOnClickOutside() {
    $('body').on('click', function (e) {
        if ($(e.target).data('toggle') !== 'popover'
            && $(e.target).parents('.popover.in').length === 0
            && $(e.target).data('manual-popover') != true
            && typeof $(e.target).data('ajax-popover') == 'undefined'
            && $(e.target).closest('[data-ajax-popover]').length === 0) {
            hidePopovers();
        }
    });
}

// *****************************************
// Load commons on modal shown

function loadCommonsOnModalShown() {
    $('.modal').on('shown.bs.modal', function (e) {
        loadCommons();
    });
}

function hideCommonsOnModalShown() {
    $('#freeModal').on('show.bs.modal', function() {
        $('main [data-toggle="tooltip"]').tooltip('hide');
        $('main [data-toggle="popover"]').popover('hide');
        $('main [data-ajax-popover]').popover('hide');
    });
}

// *****************************************
// Loaded in all pages

$(document).ready(function() {
    loadCommons(true);
    modalItemsReloaders();
    notificationsHandler();
    sideBarToggleButton();
    sideBarSearchHelpText();
    onBackButtonCloseModal();
    loadCommonsOnModalShown();
    hideCommonsOnModalShown();
    loadPageScroll();
    dismissPopoversOnClickOutside();
    switchLanguage();
    loadFiltersButtons();
});

// *****************************************
// *****************************************
// Tools to call

// *****************************************
// Reload common things, called:
// - on load of any page
// - when a view is loaded in a modal
// - when a new pagination page is loaded

function loadCommons(onPageLoad /* optional = false */) {
    onPageLoad = typeof onPageLoad == 'undefined' ? false : onPageLoad;
    loadToolTips();
    loadPopovers();
    formloaders();
    dateInputSupport();
    loadStaffOnlyButtons();
    loadCornerPopups();
    ajaxModals();
    ajaxPopovers();
    loadHDImages();
    loadImagesWithLinks();
    loadCountdowns();
    loadRanges();
    loadTimezones();
    loadMarkdown();
    loadCopyToClipboard();
    reloadDisqus();
    itemsReloaders();
    directAddCollectible($('[data-quick-add-to-collection="true"]'));
    translationsSeeAll();
    deleteFormConfirm();
    colorPicker();
    if (typeof customLoadCommons != 'undefined') {
        customLoadCommons();
    }
}

// *****************************************
// Load bootstrap

function loadToolTips() {
    $('[data-toggle="tooltip"]').tooltip();
    // Load tooltip on CuteForm
    $('.cuteform img.cuteform-elt:not([data-cuteform-text="---------"])').each(function() {
        $(this).tooltip({
            'title': $(this).data('cuteform-text'),
            'data-placement': 'top',
            'trigger': 'hover',
        });
    });
}

function loadPopovers() {
    $('[data-toggle="popover"]').popover();
}

// *****************************************
// Get text

function gettext(term) {
    var translated_term = translated_terms[term]
    if (typeof translated_term != 'undefined') {
        return translated_term;
    }
    return term;
}

// *****************************************
// Modal

// Use true for modal_size to not change the size
// Use 0 for buttons to remove all buttons
function freeModal(title, body, buttons /* optional */, modal_size /* optional */, modal /* optional */) {
    keep_size = modal_size === true;
    modal = modal ? modal : $('#freeModal');
    hidePopovers();
    hideTooltips();
    if (!keep_size) {
        modal.find('.modal-dialog').removeClass('modal-lg');
        modal.find('.modal-dialog').removeClass('modal-md');
        modal.find('.modal-dialog').removeClass('modal-sm');
        if (typeof modal_size != 'undefined') {
            modal.find('.modal-dialog').addClass('modal-' + modal_size);
        } else {
            modal.find('.modal-dialog').addClass('modal-lg');
        }
    }
    modal.find('.modal-header h1, .modal-header h4').html(title);
    modal.find('.modal-body').html(body);
    modal.find('.modal-footer').html('<button type="button" class="btn btn-main" data-dismiss="modal">OK</button>');
    if (buttons === 0) {
        modal.find('.modal-footer').hide();
    } else if (typeof buttons != 'undefined') {
        modal.find('.modal-footer').html(buttons);
        modal.find('.modal-footer').show();
    }
    modal.modal('show');
}

function confirmModal(onConfirmed, onCanceled /* optional */, title /* optional */, body /* optional */) {
    title = typeof title == 'undefined' ? gettext('Confirm') : title;
    body = typeof body == 'undefined' ? gettext('You can\'t cancel this action afterwards.') : body;
    freeModal(title, body, '\
<button type="button" class="btn btn-default">' + gettext('Cancel') + '</button>\
<button type="button" class="btn btn-danger">' + gettext('Confirm') + '</button>', undefined, $('#confirmModal'));
    $('#confirmModal .modal-footer .btn-danger').click(function() {
        onConfirmed();
        $('#confirmModal').modal('hide');
    });
    var cancelBeenCalled = false;
    $('#confirmModal .modal-footer .btn-default').click(function() {
        if (!cancelBeenCalled && typeof onCanceled != 'undefined') {
            cancelBeenCalled = true;
            onCanceled();
        }
        $('#confirmModal').modal('hide');
    });
    $('#confirmModal').on('hidden.bs.modal', function()  {
        if (!cancelBeenCalled && typeof onCanceled != 'undefined') {
            cancelBeenCalled = true;
            onCanceled();
        }
    });
}

// *****************************************
// Pagination

function load_more_function(nextPageUrl, newPageParameters, newPageCallback /* optional */, onClick) {
    var button = $('#load_more');
    let button_content = button.html();
    button.html('<div class="loader"><i class="flaticon-loading"></i></div>');
    var next_page = button.attr('data-next-page');
    $.ajax({
        'url': (
            nextPageUrl + location.search
                + (location.search == '' ? '?' : '&')
                + 'page=' + next_page
                + newPageParameters
        ),
        'success': function(data) {
            button.replaceWith(data);
            if (onClick) {
                paginationOnClick(onClick, nextPageUrl, newPageParameters, newPageCallback);
            } else {
                pagination(nextPageUrl, newPageParameters, newPageCallback);
            }
            if (typeof newPageCallback != 'undefined') {
                newPageCallback();
            }
            loadCommons();
        },
        'error': genericAjaxErrorWithCallback(function() {
            button.html(button_content);
        }),
    });
}

function pagination(nextPageUrl, newPageParameters, newPageCallback /* optional */) {
    var button = $('#load_more');
    if (button.length > 0
        && button.find('.loader').length == 0
        && ($(window).scrollTop() + $(window).height()) >= ($(document).height() - button.height() - 600)) {
        load_more_function(nextPageUrl, newPageParameters, newPageCallback, false);
    }
    $(window).scroll(
        function () {
            if (button.length > 0
                && button.find('.loader').length == 0
                && ($(window).scrollTop() + $(window).height())
                >= ($(document).height() - button.height() - 600)) {
                load_more_function(nextPageUrl, newPageParameters, newPageCallback, false);
            }
        });
}

function paginationOnClick(buttonId, nextPageUrl, newPageParameters, newPageCallback /* optional */) {
    var button = $('#' + buttonId);
    button.unbind('click');
    button.click(function(e) {
        e.preventDefault();
        load_more_function(nextPageUrl, newPageParameters, newPageCallback, buttonId);
        return false;
    });
}

// *****************************************
// Reload disqus count

function reloadDisqus() {
    // Temporary disable of Disqus comments count
    return;
    if ($('[href$="#disqus_thread"], .disqus-comment-count').length > 0) {
        if (typeof(DISQUSWIDGETS) != 'undefined') {
            DISQUSWIDGETS.getCount({reset: true});
        }
    }
}

// *****************************************
// Hide all the popovers

function hidePopovers() {
    $('[data-manual-popover="true"]').popover('hide');
    $('[data-ajax-popover]').popover('hide');
    $('[data-toggle="popover"]').popover('hide');
    $('a[href="/notifications/"]').popover('destroy');
    $('.image-with-links').popover('hide');
}

// *****************************************
// Hide all the tooltips

function hideTooltips() {
    $('[data-manual-tooltip="true"]').tooltip('hide');
    $('[data-toggle="tooltip"]').tooltip('hide');
}

// *****************************************
// Generic ajax error

function genericAjaxError(xhr, ajaxOptions, thrownError) {
    if (debug) {
        let html;
        try {
            html = $(xhr.responseText);
            if (html.find('body').length > 0) {
                if (html.find('main').length > 0) {
                    html = html.find('main');
                } else {
                    html = html.find('body');
                    html.find('.navbar-fixed-top').remove();
                }
            }
        }
        catch(err) {
            html = '<pre>' + xhr.responseText + '</pre>';
        }
        freeModal('Debug: ' + ajaxOptions + ' - ' + thrownError, html);
    } else {
        freeModal('Server error', 'Please retry. If the problem persists, contact us.');
    }
}

function genericAjaxErrorWithCallback(callback) {
    return function(xhr, ajaxOptions, thrownError) {
        genericAjaxError(xhr, ajaxOptions, thrownError);
        callback();
    };
}

// *****************************************
// Objects, arrays

function set(object, keys, value) {
    if (keys.length == 0) {
        return;
    } else if (keys.length == 1) {
        object[keys[0]] = value;
        return;
    } else {
        if (typeof(object[keys[0]]) == 'undefined') {
            object[keys[0]] = {}
            return set(object[keys[0]], keys.slice(1), value);
        }
    }
}

function getAllValues(elements, attribute) {
    return Array.from(new Set(
        elements.map(function() {
            return $(this).attr(attribute);
        }).get()));
}

// *****************************************
// Handle actions on activities view

function cropActivityWhenTooLong(activity) {
    if (!max_activity_height) {
        return;
    }
    let message = activity.find('.message').first();
    if (message.height() > max_activity_height) {
        let message_more = activity.find('.title-separator');
        if (message_more.length == 0) {
            let messageMore = gettext('More') + ' <span class="glyphicon glyphicon-triangle-bottom"></span>';
            let messageLess = gettext('Less') + ' <span class="glyphicon glyphicon-triangle-top"></span>';
            message_more = $('<div class="title-separator"><span>' + messageMore + '</span></div>');
            message.css('height', max_activity_height);
            message.css('overflow', 'hidden');
            message_more.click(function(e) {
                e.preventDefault();
                if (message_more.find('span').html() == messageMore) {
                    message.css('height', 'auto');
                    message.css('overflow', 'auto');
                    message_more.find('span').html(messageLess);
                } else {
                    message.css('height', max_activity_height);
                    message.css('overflow', 'hidden');
                    message_more.find('span').html(messageMore);
                }
                return false;
            });
            message.after(message_more);
        }
    }
}

function isElementAloneOnLine(elt) {
    return elt.has('*').length == 0 && $.trim(elt.parent().text()) == $.trim(elt.text());
}

function getYouTubeCode(url) {
    const youtube_regex = /^.*((m\.)?youtu\.be\/|vi?\/|u\/\w\/|embed\/|\?vi?=|\&vi?=)([^#\&\?]*).*/;
    let parsed = url.match(youtube_regex);
    if (!parsed || !parsed[3]) {
        return null;
    }
    let video_code = parsed[3];
    if (video_code.endsWith('/')) {
        video_code = video_code.slice(0,-1);
    }
    return video_code;
}

function afterMarkdownApplied(elt) {
    let activity = elt.closest('.activity');

    if (activity.length > 0) {

        if (!activity.data('updated-activity')) {
            activity.data('updated-activity', true);

            // Activities that are too long

            cropActivityWhenTooLong(activity);

            // Dynamic loaded items in activities

            if ($(document).width() > 768) {
                if (activity.data('dynamically-load-items')) {

                    $.each(main_collections, function (collection, callback) {
                        activity.find('.message a[href^="' + site_url + collection + '/"]').each(function() {
                            let a = $(this);
                            if (isElementAloneOnLine(a)) {
                                let url_parts = a.prop('href').replace(
                                    '/' + collection + '/', '/ajax/' + collection + '/').split('/');
                                url_parts = url_parts.splice(0, url_parts.length - 2)
                                let url = url_parts.join('/') + '/';
                                $.ajax({
                                    type: 'GET',
                                    url: url,
                                    success: function(data) {
                                        a.replaceWith('<div class="well fontx0-8">' + data + '</div>');
                                        if (callback) {
                                            window[callback]();
                                        }
                                        loadCommons();
                                        cropActivityWhenTooLong(activity);
                                    },
                                    // Fails silently
                                });
                            }
                        });
                    });
                }
            }
        }
    }

    // YouTube videos

    elt.find('a[href*="youtube.com"], a[href*="youtu.be"]').each(function() {
        let a = $(this);
        let video_code = getYouTubeCode(a.prop('href'));
        if (video_code && isElementAloneOnLine(a)) {
            a.replaceWith('<div class="youtube-embed-container"><iframe src="https://www.youtube.com/embed/' + video_code + '" frameborder="0" allowfullscreen></iframe></div>');
            if (activity.length > 0) {
                cropActivityWhenTooLong(activity);
            }
        }
    });

    // Colors

    applyMarkdownCustomTags(elt);
}

function updateActivities() {
    // Like activities

    $('.likeactivity').unbind('submit');
    $('.likeactivity').submit(function(e) {
        e.preventDefault();
        var loader = $(this).find('.hidden-loader');
        var button = $(this).find('button[type=submit]');
        loader.width(button.width());
        button.hide();
        loader.show();
        $(this).ajaxSubmit({
            context: this,
            success: function(data) {
                if (data['result'] == 'liked' || data['result'] == 'unliked') {
                    if (data['result'] == 'liked') {
                        $(this).find('input[type=hidden]').prop('name', 'unlike');
                    } else if (data['result'] == 'unliked') {
                        $(this).find('input[type=hidden]').prop('name', 'like');
                    }
                    var value = button.html();
                    button.html(button.attr('data-reverse'));
                    button.attr('data-reverse', value);
                }
                loader.hide();
                button.show();
                button.addClass('disabled');
                button.click(function(e) { e.preventDefault(); return false; });
                if (typeof data['total_likes'] != 'undefined') {
                    $(this).find('a[href="#likecount"]').text(data['total_likes']);
                }
            },
            error: genericAjaxErrorWithCallback(function() {
                loader.hide();
                button.show();
                button.addClass('disabled');
            }),
        });
        return false;
    });

    // Archive/Unarchive, Bump, Drown activity

    let _onSuccessHandler = function(button, message) {
        button.find('.message').text(message);
        button.addClass('disabled');
        button.blur();
        let flaticon = button.find('[class^="flaticon"]');
        flaticon.removeClass();
        flaticon.addClass('flaticon-checked');
    };
    let _hideShowArchivedIcons = function(button, data) {
        if (data['result']['archived']) {
            button.closest('.activity').find('.activity-info-archived').show();
        } else {
            button.closest('.activity').find('.activity-info-archived').hide();
        }
        if (data['result']['archived_by_staff']) {
            let icon = button.closest('.activity').find('.activity-info-ghost-archived');
            icon.attr('data-original-title', 'Archived<br>by ' + data['result']['archived_by_staff']);
            icon.tooltip('fixTitle');
            icon.show();
        } else {
            button.closest('.activity').find('.activity-info-ghost-archived').hide();
        }
    };
    let _hideShowIcons = function(button, data, icon) {
        if (data['result'][icon]) {
            button.closest('.activity').find('.activity-info-' + icon).show();
        } else {
            button.closest('.activity').find('.activity-info-' + icon).hide();
        }
    };
    let _onArchive = function(button, data) {
        _onSuccessHandler(button, gettext('Archived') + '!');
        _hideShowArchivedIcons(button, data);
    };
    let _onUnArchive = function(button, data) {
        _onSuccessHandler(button, gettext('Unarchived') + '!');
        _hideShowArchivedIcons(button, data);
    };
    let _onMarkStaffPick = function(button, data, action) {
        _onSuccessHandler(button, gettext(action));
        _hideShowIcons(button, data, 'staff-picks');
        let tags = button.closest('.activity').find('.tags');
        tags.empty();
        $.each(data['result']['tags'], function (key, value) {
            tags.append('<a href="/activities/?c_tags=' + key + '" target="_blank" class="text-muted">#' + value + '</a> ');
        });
    };
    let _onSuccessActivities = {
        'archive': _onArchive,
        'ghost-archive': _onArchive,
        'unarchive': _onUnArchive,
        'ghost-unarchive': _onUnArchive,
        'bump': function(button, data) { _onSuccessHandler(button, 'Bumped!') },
        'drown': function(button, data) { _onSuccessHandler(button, 'Drowned!') },
        'mark-staff-pick': function(button, data) { _onMarkStaffPick(button, data, 'Marked as staff pick!'); },
        'remove-from-staff-pick': function(button, data) { _onMarkStaffPick(button, data, 'Removed from staff picks!'); },
    };

    $.each(_onSuccessActivities, function(button_name, _) {
        let buttons = $('.activity').find('[data-btn-name="' + button_name + '"]');
        buttons.unbind('click');
        buttons.click(function(e) {
            e.preventDefault();
            let button = $(this);
            let csrf_token = button.data('csrf-token');
            let loader = $(
                '<a href="#" class="' + button.attr('class')
                    + '" disabled="disabled" style="width: ' + button.outerWidth()
                    + 'px;"><i class="flaticon-loading"></i></a>');
            button.hide();
            button.after(loader);
            $.ajax({
                type: 'POST',
                url: button.prop('href'),
                data: {
                    'csrfmiddlewaretoken': csrf_token,
                },
                success: function(data) {
                    _onSuccessActivities[button.data('btn-name')](button, data);
                    loader.remove();
                    button.show();
                },
                error: genericAjaxErrorWithCallback(function() {
                    loader.remove();
                    button.show();
                }),
            });
            return false;
        });
    });
}

// *****************************************
// Handle activities form

function updateActivityForm() {
    let form = $('[data-form-name="edit_activity"], [data-form-name="add_activity"]');
    let save_checkbox = form.find('#id_save_activities_language');
    function changeActivityPreferencesLabel(action) {
        save_checkbox.closest('.form-group').find('.selected_language').text(
            form.find('#id_i_language option:selected').text(),
        );
        let auto_check = (
            save_checkbox.data('activities-language')
                == form.find('#id_i_language').val()
        );
        save_checkbox.prop('checked', auto_check);
        if (auto_check) {
            save_checkbox.closest('.form-group').hide(action);
        } else {
            save_checkbox.closest('.form-group').show(action);
        }
    }
    changeActivityPreferencesLabel();
    form.find('#id_i_language').change(function() {
        changeActivityPreferencesLabel('fast');
    });
}

// *****************************************
// Handle private messages

function loadPrivateMessages() {
    // Show "End of new messages" separator
    $('.title-separator').remove();
    let last_message = $('.is-new-message').last().closest('.private-message').closest('.row');
    if (last_message.next('.row').length) {
        last_message.after(
            '<div class="title-separator"><span>' + (
                gettext('End of new messages')
            ) + '</span></div>');
    }

    // Render links into clickable links
    $('.private-message:not(.linked)').each(function() {
        let content = $(this).find('.message-content');
        content.html(Autolinker.link($('<div>').text(content.text()).html(), {
            newWindow: true,
            stripPrefix: false,
            stripTrailingSlash: false,
        }));
        $(this).addClass('linked');
    });

    // Close birthday popup if opened
    $('.corner-popup[data-name="profile_birthday"]').remove();
}

// *****************************************
// Handle form to update users for staff

function updateStaffEditUserForm() {
    function _onCheck(action) {
        $('[data-form-name="edit_user"] #id_c_groups input[name="c_groups"]').each(function() {
            let input = $(this);
            let form_group = $('[data-form-name="edit_user"] [id^=id_group_settings_' + input.val() + '_]').closest('.form-group');
            if (input.prop('checked') !== true) {
                form_group.hide(action);
                input.parent().find('p, br:not(:first-of-type), ul, .alert').hide(action);
                input.parent().find('img').css('height', 30);
            } else {
                form_group.show(action);
                input.parent().find('p, br:not(:first-of-type), ul, .alert').show(action);
                input.parent().find('img').css('height', 60);
            }
        });
    }
    _onCheck();
    $('[data-form-name="edit_user"] #id_c_groups input[name="c_groups"]').change(function() {
        _onCheck('fast');
    });
}

// *****************************************
// Markdown + AutoLink

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};

function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}

function isColor(strColor) {
    const s = new Option().style;
    s.color = strColor;
    return s.color !== '';
}

let valid_date_regexp = new RegExp(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)$/);

function isValidDate(strDate) {
    let date = new Date(strDate);
    return valid_date_regexp.test(strDate) && date instanceof Date && !isNaN(date);
}

function toUTCDate(strDate) {
    return strDate + 'Z';
}

let CUSTOM_TAGS = {
    'color': {
        'is_valid': isColor,
        'to_html_open': function(tag, value) {
            return '<span style="' + tag + ': ' + value + ';">';
        },
    },
    'countdown': {
        'is_valid': isValidDate,
        'to_value': toUTCDate,
        'to_html_open': function(tag, value) {
            return '<span class="countdown" data-date="' + value + '" data-format="{time}">';
        },
        'after': loadCountdowns,
    },
    'utcdate': {
        'is_valid': isValidDate,
        'to_value': toUTCDate,
        'to_html_open': function(tag, value) {
            return '<span class="timezone"><span class="datetime">' + value + '</span> (<span class="current_timezone">UTC</span>)';
        },
        'after': loadTimezones,
    },
    'timeago': {
        'is_valid': isValidDate,
        'to_value': toUTCDate,
        'to_html_open': function(tag, value) {
            return '<span class="timezone" data-timeago="true"><span class="datetime">' + value + '</span> (<span class="current_timezone">UTC</span>)';
        },
        'after': loadTimezones,
    },
};

function applyMarkdownCustomTags(elt) {
    $.each(CUSTOM_TAGS, function(tag, options) {
        elt.find("*:contains('[" + tag + "='):contains('[/" + tag + "]')").each(function() {
            let elt = $(this);
            if (elt.is('pre') || elt.closest('pre').length > 0) { // Don't do ``` blocks
                return;
            }
            let text = elt.text();
            let html = elt.html();
            $.each(text.split('[' + tag + '='), function(i, text) {
                if (i > 0) { // anything before the tag is left as is
                    let value = text.split(']')[0];
                    let content = text.split(']')[1].split('[/' + tag + '')[0];
                    let remaining = text.split('[/' + tag + ']')[1];
                    if (options.is_valid(value)) {
                        let displayed_value = value;
                        if (options.to_value) {
                            displayed_value = options.to_value(value);
                        }
                        let opening_tag = options.to_html_open(tag, displayed_value);
                        let closing_tag;
                        if (options.to_html_close) {
                            closing_tag = options.to_html_close(tag, displayed_value);
                        } else {
                            closing_tag = '</' + opening_tag.split('<')[1].split(' ')[0].split('>')[0] + '>';
                        }
                        html = html.replace('[' + tag + '=' + value + ']', opening_tag);
                        html = html.replace('[/' + tag + ']', closing_tag);
                    }
                }
            });
            elt.html(html);
        });
    });
    $.each(CUSTOM_TAGS, function(tag, options) {
        if (options.after) {
            options.after();
        }
    });
}

function applyMarkdown(elt) {
    if (elt.hasClass('allow-html')) {
        elt.html(Autolinker.link(marked(elt.text()), { newWindow: true, stripPrefix: true } ));
        afterMarkdownApplied(elt);
    } else if (elt.hasClass('with-github')) {
        let content = elt.text();
        elt.css('opacity', 0.1);
        elt.css('white-space', 'pre');
        let loader = $('<div class="text-center" style="font-size: 50px; line-height: 60px; margin-bottom: -60px;"><i class="flaticon-loading"></i></div>');
        elt.parent().prepend(loader);
        $.ajax({
            'method': 'post',
            'url': 'https://api.github.com/markdown/raw',
            'data': content,
            'headers': { 'content-type': 'text/plain' },
            'success': function(data) {
                loader.remove();
                elt.html(data);
                afterMarkdownApplied(elt);
                elt.css('white-space', 'normal');
                elt.css('opacity', 1);
            },
            'error': function() {
                console.log('Couldn\'t use GitHub to convert Markdown!');
                loader.remove();
                elt.html(Autolinker.link(marked(escapeHtml(elt.text())), { newWindow: true, stripPrefix: true } ));
                afterMarkdownApplied(elt);
                elt.css('white-space', 'normal');
                elt.css('opacity', 1);
            },
        });
    } else {
        elt.html(Autolinker.link(marked(escapeHtml(elt.text())), { newWindow: true, stripPrefix: true } ));
        afterMarkdownApplied(elt);
    }
}

function _loadMarkdown() {
    $('.to-markdown:not(.markdowned)').each(function() {
        $(this).addClass('markdowned');
        applyMarkdown($(this));
    });
}

function loadMarkdown() {
    if ($('.to-markdown').length > 0) {
        if (typeof marked == 'undefined') {
            $.getScript(static_url + 'bower/marked/lib/marked.js', _loadMarkdown);
        } else {
            _loadMarkdown();
        }
    }
    $('.was-markdown').each(function() {
        afterMarkdownApplied($(this));
    });
}

function loadCopyToClipboard() {
    $('[data-copy-to-clipboard]').unbind('click');
    $('[data-copy-to-clipboard]').click(function(e) {
        e.preventDefault();
        let button = $(this);
        let tmp = $('<input>');
        $('body').append(tmp);
        tmp.val(button.data('copy-to-clipboard')).select();
        document.execCommand('copy');
        tmp.remove();
        button.tooltip({
            'title': gettext('Copied'),
            'placement': 'top',
            'trigger': 'manual',
        });
        button.tooltip('show');
        setTimeout(function(){
            button.tooltip('hide');
        }, 2000);
    });
}

// *****************************************
// Accounts

function loadAccounts() {
    // Kept for retrocompabibility reasons
}

// *****************************************
// Load Badges

function updateBadges() {
    ajaxModals();
}

function afterLoadBadges(user_id) {
    updateBadges();
    pagination('/ajax/badges/', '&of_user=' + user_id, updateBadges);
}

function loadBadges(tab_name, user_id, onDone) {
    $.ajax({
        'url': '/ajax/badges/?of_user=' + user_id + '&ajax_show_top_buttons&ajax_show_no_result&buttons_color=' + $('#profile').data('color'),
        'success': function(data) {
            onDone(data, afterLoadBadges);
        },
        'error': genericAjaxError,
    });
}

// *****************************************
// Load filters buttons

function loadFiltersButtons() {
    $('#filter-form-extra-buttons a').each(function() {
        if ($(this).data('callback')) {
            window[$(this).data('callback')]($(this));
        }
    });
}

function loadPresets(button) {
    if (button.data('always-hidden')) {
        return;
    }
    button.show();
    function onClick(e) {
        e.preventDefault();
        $('#filter-form-presets').toggle();
        $('#filter-form-fields').toggle();
        $('#filter-form-search-button').toggle();
        $('#sidebar-wrapper .sticky-buttons.back').toggle();
        return false;
    }
    button.unbind('click');
    button.click(onClick);
    $('#sidebar-wrapper .sticky-buttons.back a').unbind('click');
    $('#sidebar-wrapper .sticky-buttons.back a').click(onClick);
}

function loadRandomFilters(button) {
    let form = $('#sidebar-wrapper form[id^="filter-form-"]');
    button.unbind('click');
    button.click(function onClick(e) {
        e.preventDefault();
        form.prop('action', button.prop('href'));
        form.submit();
        return false;
    });
}

// *****************************************
// Index

function loadIndex() {
    // Load HD background image when provided
    let home = $('.home-wrapper[data-hd-art]');
    if (home.length > 0 && $(document).width() > 992) {
        home.css('background-image', 'url(\'' + home.data('hd-art') + '\')');
    }
}

// *****************************************
// d_FieldCheckBoxes

function _hideDetails() {
    let formGroup = $(this).closest('.form-group');
    formGroup.find('.help-block').hide();
}

function _switchBold() {
    let formGroup = $(this).closest('.form-group');
    formGroup.find('label').css('font-weight', 'normal');
    formGroup.find('.help-block').css('font-weight', 'bold');
    if ($(window).width() > 762) {
        formGroup.find('.help-block').css('margin-left', '-50%');;
        formGroup.find('.help-block').css('width', '150%');;
    }
}

function d_FieldCheckBoxes(selector) {
    selector.each(_switchBold);
    selector.not(":eq(0)").each(_hideDetails);
}

// *****************************************
// iTunes

function pauseAllSongs() {
    $('audio').each(function() {
        $(this)[0].pause();
        $(this).closest('div').find('[href=#play] i').removeClass();
        $(this).closest('div').find('[href=#play] i').addClass('flaticon-play');
    });
}

function loadiTunesData(song, successCallback, errorCallback) {
    var itunes_id = song.data('itunes-id');
    $.ajax({
        "url": 'https://itunes.apple.com/lookup',
        "dataType": "jsonp",
        "data": {
            "country": "JP",
            "id": itunes_id,
        },
        "error": function (jqXHR, textStatus, message) {
            if (typeof errorCallback != 'undefined') {
                errorCallback();
            }
            alert('Oops! This music doesn\'t seem to be valid anymore. Please contact us and we will fix this.');
        },
        "success": function (data, textStatus, jqXHR) {
            data = data['results'][0];
            let details = song.find('.itunes-details');
            details.find('.album').prop('src', data['artworkUrl60']);
            details.find('.itunes-link').prop('href', data['trackViewUrl'] + '&at=1001l8e6');
            details.show('fast');
            song.find('audio source').prop('src', data['previewUrl'])
            song.find('audio')[0].load();
            playSongButtons();
            if (typeof successCallback != 'undefined') {
                successCallback(song, data);
            }
        }
    });
}

function loadAlliTunesData(successCallback, errorCallback) {
    $('.itunes').each(function() {
        $(this).html('<audio controls="" id="player" class="hidden">\
            <source src="" type="audio/mp4">\
              Your browser does not support the audio element.\
          </audio>\
          <span style="display: none" class="itunes-details">\
            <img src="" alt="Future style" class="album img-rounded" height="31">\
            <a href="" target="_blank" class="itunes-link">\
              <img src="' + static_url + 'img/get_itunes.svg" alt="Get it on iTunes" height="31">\
            </a>\
          </span>\
          <a href="#play" class="fontx1-5"><i class="flaticon-play"></i></a>\
');
        loadiTunesData($(this), successCallback, errorCallback);
    });
}

function playSongButtons() {
    $('audio').on('ended', function() {
        pauseAllSongs();
    });
    $('[href=#play]').unbind('click');
    $('[href=#play]').click(function(event) {
        event.preventDefault();
        var button = $(this);
        var button_i = button.find('i');
        var song = button.closest('.itunes');
        // Stop all previously playing audio
        if (button_i.prop('class') == 'flaticon-pause') {
            pauseAllSongs();
            return;
        }
        pauseAllSongs();
        if (song.find('audio source').attr('src') != '') {
            song.find('audio')[0].play();
            button_i.removeClass();
            button_i.addClass('flaticon-pause');
        } else {
            button_i.removeClass();
            button_i.addClass('flaticon-loading');
            loadiTunesData(song, function(data) {
                song.find('audio')[0].play();
                button_i.removeClass();
                button_i.addClass('flaticon-pause');
            }, function() {
                button_i.removeClass();
                button_i.addClass('flaticon-play');
            });
        }
        return false;
    });
}

// *****************************************
// CSS

function injectStyles(rule) {
  var div = $("<div />", {
    html: '&shy;<style>' + rule + '</style>'
  }).appendTo("body");
}

function setHomepageArt(settings) {
    if (settings.url) {
        $('.home-wrapper').removeAttr('data-hd-art');
        $('.home-wrapper').css('background-image', 'url(\'' + settings.url + '\')');
        if (!settings.foreground_url) {
            $('.home-wrapper').find('.home-foreground').remove();
        }
    }
    if (settings.gradient) {
        $('.home-wrapper').addClass('with-gradient');
    } else {
        $('.home-wrapper').removeClass('with-gradient');
    }
    if (settings.ribbon) {
        $('.home-wrapper').addClass('with-ribbon');
    } else {
        $('.home-wrapper').removeClass('with-ribbon');
    }
    if (settings.side) {
        $('.home-wrapper').removeClass('left');
        $('.home-wrapper').removeClass('right');
        $('.home-wrapper').removeClass('center');
        $('.home-wrapper').addClass(settings.side);
    }
    if (settings.position && settings.position.position) {
        $('.home-wrapper').css('background-position', settings.position.position);
    }
    if (settings.position && settings.position.size) {
        $('.home-wrapper').css('background-size', settings.position.size);
    }
    if (settings.position && settings.position.y) {
        $('.home-wrapper').css('background-position-y', settings.position.y);
    }
    if (settings.position && settings.position.x) {
        $('.home-wrapper').css('background-position-x', settings.position.x);
    }
}

// *****************************************
// Ordinal suffix (English only), 1st, 2nd, 3rd, 4th, ...

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

// *****************************************
// Dynamic forms

function isNullBool(input) {
    if (input.is('select')) {
        let values = $.map(input.find('option'), function(elt, i) { return $(elt).val();})
        let values_of_nullbool = ['1', '2', '3'];
        if (values.length == values_of_nullbool.length
            && values.every(function(element, index) { return element === values_of_nullbool[index]; })) {
            return true;
        }
    }
    return false;
}

function hasValue(input) {
    // Multiple choice checkboxes
    if (input.is('ul') && input.find('[type="checkbox"]:checked, [type="radio"]:checked').length > 0) {
        return true;
    }
    // Checkbox
    if (input.is('[type="checkbox"]')) {
        return input.prop('checked');
    }
    // Null boolean
    else if (isNullBool(input)) {
        return input.val() != '1';
    }
    return input.val() != '';
}

function getValue(input) {
    // Multiple choice checkboxes or radio boxes
    if (input.is('ul')) {
        let result = [];
        $.each(input.find('[type="checkbox"]:checked, [type="radio"]:checked'), function() {
            result.push($(this).prop('value'));
        });
        return result;
    }
    // Checkbox
    if (input.is('[type="checkbox"]')) {
        return input.prop('checked');
    }
    // Null boolean
    else if (isNullBool(input)) {
        return {
            null: null,
            '1': null,
            '2': true,
            '3': false,
        }[input.val()];
    }
    return input.val();
}

function formShowMore(form, cutOff, includingCutOff, until, includingUntil, messageMore, messageLess, checkValues) {
    includingCutOff = typeof(includingCutOff) == 'undefined' ? false : includingCutOff;
    includingUntil = typeof(includingUntil) == 'undefined' ? false : includingUntil;
    messageMore = typeof(messageMore) == 'undefined' ? gettext('More') : messageMore;
    messageLess = typeof(messageLess) == 'undefined' ? gettext('Less') : messageLess;
    checkValues = typeof(checkValues) == 'undefined' ? true : checkValues;
    if (typeof(until) != 'undefined') {
        formSeparator(form, until, true);
    }
    var flag = false;
    var hidden_fields = [];
    var cutOffField = undefined;
    var hidden_at_init = true;

    function _hasValue(input) {
        if (!checkValues) {
            return false;
        }
        return hasValue(input);
    }

    function pushToHiddenFields(field) {
        hidden_fields.push(field);
        let input = field.find('[id^="id_"]');
        if (input.length > 0 && _hasValue(input)) {
            hidden_at_init = false;
        }
    }

    form.find('.form-group').each(function() {
        if (flag) {
            if ($(this).find('#id_' + until).length == 0 || includingUntil) {
                pushToHiddenFields($(this));
            } else {
                flag = false;
            }
        } else {
            if ($(this).find('#id_' + cutOff).length > 0) {
                cutOffField = $(this);
                flag = true;
                if (includingCutOff) {
                    pushToHiddenFields(cutOffField);
                }
            }
        }
    });
    if (typeof(cutOffField) != 'undefined') {
        $.each(hidden_fields, function(i, field) {
            if (hidden_at_init) {
                field.hide();
            } else {
                field.show();
            }
        });
        let more = messageMore + ' <span class="glyphicon glyphicon-triangle-bottom"></span>';
        let less = messageLess + ' <span class="glyphicon glyphicon-triangle-top"></span>';
        let separator = $('<div class="title-separator" data-status="'
                          + (hidden_at_init ? 'hidden' : 'shown') + '"><span>'
                          + (hidden_at_init ? more : less) + '</span></div>');
        if (includingCutOff) {
            cutOffField.before(separator);
        } else {
            cutOffField.after(separator);
        }
        separator.click(function() {
            if (separator.data('status') == 'hidden') {
                $.each(hidden_fields, function(i, field) {
                    field.show('fast');
                });
                separator.find('span').html(less);
                separator.data('status', 'shown');
            } else {
                $.each(hidden_fields, function(i, field) {
                    field.hide('fast');
                });
                separator.find('span').html(more);
                separator.data('status', 'hidden');
            }
        });
    }
}

function formSeparator(form, cutOff, includingCutOff, title) {
    includingCutOff = typeof(includingCutOff) == 'undefined' ? false : includingCutOff;
    title = typeof(title) == 'undefined' ? '' : title;
    let separator = $('<div class="form-group"><div class="title-separator"><span>' + title + '</span></div></div>');
    let cutOffField = form.find('#id_' + cutOff).closest('.form-group');
    if (includingCutOff) {
        cutOffField.before(separator);
    } else {
        cutOffField.after(separator);
    }
}

function formOnChangeValueShow(form, changingFieldName, valuesToShow) {
    // valuesToShow can be an array of field names
    // or an object { value: array of field names }
    let changingField = form.find('#id_' + changingFieldName);
    let allFields = [];
    let originalInputVals = {};
    function onChange(animation) {
        if (Array.isArray(valuesToShow)) {
            $.each(valuesToShow, function(i, fieldName) {
                let input = form.find('#id_' + fieldName);
                let field = input.closest('.form-group');
                if (hasValue(changingField)) {
                    input.val(originalInputVals[fieldName]);
                    field.show(animation);
                } else {
                    input.val('');
                    input.trigger('change');
                    field.hide(animation);
                }
            });
        } else {
            let to_show = [];
            $.each(valuesToShow, function(value, fields) {
                if (String(getValue(changingField)).toLowerCase() == String(value).toLowerCase()) {
                    $.each(fields, function(i, fieldName) {
                        if (!to_show.includes(fieldName)) {
                            to_show.push(fieldName);
                        }
                    });
                }
            });
            $.each(allFields, function(i, fieldName) {
                let input = form.find('#id_' + fieldName);
                let field = input.closest('.form-group');
                if (to_show.includes(fieldName)) {
                    field.show(animation);
                    input.val(originalInputVals[fieldName]);
                } else {
                    input.val('');
                    input.trigger('change');
                    field.hide(animation);
                }
            });
        }
    }
    if (Array.isArray(valuesToShow)) {
        allFields = valuesToShow;
    } else {
        $.each(valuesToShow, function(value, fields) {
            $.each(fields, function(i, fieldName) {
                if (!allFields.includes(fieldName)) {
                    allFields.push(fieldName);
                }
            });
        });
    }
    loadCommons(); // Make sure dateInput initials are set
    // Save original values
    $.each(allFields, function(i, fieldName) {
        let input = form.find('#id_' + fieldName);
        originalInputVals[fieldName] = input.val();
    });
    onChange();
    changingField.change(function() {
        onChange('fast');
    })
}

function formOnChangeValueTrigger(form, changingFieldName, valuesThatTrigger) {
    // valuesThatTrigger can be a callback name name or a callback
    // or an object { value: callback name name or callback }
    let changingField = form.find('#id_' + changingFieldName);
    function onChange(animation) {
        if (typeof valuesThatTrigger == 'string') {
            window[valuesThatTrigger]();
        } else if ($.isFunction(valuesThatTrigger)) {
            valuesThatTrigger();
        } else {
            $.each(valuesThatTrigger, function(value, callback) {
                if (String(getValue(changingField)).toLowerCase() == String(value).toLowerCase()) {
                    if (typeof callback == 'string') {
                        window[callback]();
                    } else if ($.isFunction(callback)) {
                        callback();
                    }
                }
            });
        }
    }
    onChange();
    changingField.change(function() {
        onChange('fast');
    })
}

// *****************************************
// CuteForm

function modalCuteFormSeparators(settings) {
    let with_hr = typeof(settings['hr']) == 'undefined' ? false : settings['hr'];
    let with_margin = typeof(settings['margin']) == 'undefined' ? false : settings['margin'];

    $('#cuteform-modal').on('show.bs.modal', function() {
        if ($(document).width() >= 1016) {
            var i = 1;
            $.each([
                {
                    'by': 'by_name_prefix_nth',
                    'selector': function(name, nth) {
                        return '[data-cuteform-name^="' + name + '"] .cuteform-elt'
                            + (typeof(nth) == 'undefined' ? '' : ':eq(' + nth + ')');
                    },
                },
                {
                    'by': 'by_name_prefix_value',
                    'selector': function(name, nth) {
                        return '[data-cuteform-name^="' + name + '"] .cuteform-elt'
                            + (typeof(nth) == 'undefined' ? '' : '[data-cuteform-val="' + nth + '"]');
                    },
                },
                {
                    'by': 'by_name',
                    'selector': function(name, nth) {
                        return '[data-cuteform-name="' + name + '"] .cuteform-elt'
                            + (typeof(nth) == 'undefined' ? '' : ':nth-child(' + nth + ')');
                    },
                },
                {
                    'by': 'by_value_prefixes',
                    'selector': function(name, nth) {
                        return typeof(nth) == 'undefined' ?
                            '[data-cuteform-val^="' + name + '"]'
                            : '[data-cuteform-val="' + name + '-' + nth + '"]';
                    },
                },
            ], function(_i, by) {

                $.each(settings[by['by']] || {}, function(i, field) {
                    let name = field[0];
                    let nths = field[1];
                    let elts = $('#cuteform-modal ' + by['selector'](name));

                    if (elts.length > 0) {

                        if (i == 1) { // First match
                            if (settings['callback_before']) {
                                settings['callback_before'](elts);
                            }

                            let empty_selector = $('#cuteform-modal [data-cuteform-val=""]');
                            empty_selector.css('height', elts.first().height());
                            empty_selector.css('margin', '0 20px 0 40px');
                            empty_selector.css('float', 'left');
                        }

                        let empty_width = $('#cuteform-modal [data-cuteform-val=""]').width() + 30 + 60;

                        let separator = with_margin ? (
                            '<' + (with_hr ? 'hr' : 'div') + ' style="margin: 5px; margin-left: '
                                + empty_width + 'px;">' + (with_hr ? '' : '</div>')
                                + '<div style="display: inline-block; width: '
                                + empty_width + 'px;"></div>'
                        ) : (with_hr ? '<hr>' : '<br style="display: block;">');

                        elts.last().after(
                            Object.keys(settings[by['by']]).length == i ? // Last only
                                '<br style="display: block;">'
                                : separator,
                        );

                        $.each(nths, function(index, nth) {
                            $('#cuteform-modal ' + by['selector'](name, nth)).after(separator);
                        });

                        i++;
                    }
                });
            });
        }
    });
}

// *****************************************
// Abstract utils

function loadBaseEvent() {
    if (event_collection_name && with_versions) {
        // Versions panels
        $('[class^="item-info ' + event_collection_name + '"]:not(.loaded)').each(function() {
            let event = $(this);
            event.addClass('loaded');
            $.each(versions, function(version_name, version) {
                let main_field = event.find(' tr[data-field="' + version_name + '"]');
                if (main_field.length > 0) {
                    let fields = event.find('[data-field^="' + version.prefix + '"]');
                    // Add some spacing to separate version fields from the rest
                    fields.first().find('th, td').css('border-top', 0);
                    fields.last().after('<tr><td colspan="99" height="40px" style="border-top: 0"></td></tr>');
                    main_field.before('<tr><td colspan="99" height="40px" style="border-top: 0"></td></tr>');
                    // Add separator with button to show/hide
                    let separator_tr = (
                        $(document).width() > 992 ?
                            $('<tr><td></td><td colspan="99"><div class="title-separator"><span></span></div></td></tr>')
                            : $('<tr><td colspan="99"><div class="title-separator"><span></span></div></td></tr>')
                    );
                    separator_tr.find('th, td').css('border-top', 0);
                    fields.first().before(separator_tr);
                    // When screen is big enough, make it a sub table
                    if ($(document).width() > 992) {
                        let tr = $('<tr><td></td><td colspan="2"><table class="table"></table></td></tr>');
                        tr.find('th, td').css('border-top', 0);
                        separator_tr.after(tr);
                        fields.appendTo(tr.find('table'));
                    } else {
                        // Otherwise, make the text smaller
                        fields.css('font-size', '0.8em');
                    }
                    // Remove the prefixes to the field names
                    let prefix = version.translation + ' - ';
                    fields.each(function() {
                        let field_name = $(this).find('.verbose-name').text();
                        if (field_name.startsWith(prefix)) {
                            $(this).find('.verbose-name').text(field_name.slice(prefix.length));
                        }
                    });

                    let open_html = '<a href="#" class="btn btn-secondary btn-lg">' + gettext('Open {thing}').replace(
                        '{thing}', version.translation) + ' <span class="glyphicon glyphicon-triangle-bottom"></span></a>';
                    let close_html = '<a href="#" class="text-muted a-nodifference">' + gettext('Close {thing}').replace(
                        '{thing}', version.translation) + ' <span class="glyphicon glyphicon-triangle-top"></span></a>';
                    function toggleVersionFields(toggle, animation) { // true = open, false = close
                        if (toggle) {
                            separator_tr.find('span').html(close_html);
                            fields.show(animation);
                            separator_tr.find('a').unbind('click');
                            separator_tr.find('a').click(function(e) {
                                e.preventDefault();
                                toggleVersionFields(false, 'fast');
                                return false;
                            });
                        } else {
                            separator_tr.find('span').html(open_html);
                            fields.hide(animation);
                            separator_tr.find('a').unbind('click');
                            separator_tr.find('a').click(function(e) {
                                e.preventDefault();
                                toggleVersionFields(true, 'fast');
                                return false;
                            });
                        }
                    }
                    if (opened_versions.includes(version_name)) {
                        toggleVersionFields(true);
                    } else {
                        toggleVersionFields(false);
                    }

                }
            });
        });
    }
}

// *****************************************
// Seasonal

function adventCalendar() {
    let today = new Date();
    let day = today.getDate().toString();
    if (!advent_calendar_days_opened.includes(day)) {
        let button = $('.corner-popup [data-btn-name="open_calendar"]');
        button.html(button.text() + ' <span class="label label-success">' + day + '</span>');
        button.prop('href', button.prop('href') + day + '/');
        button.data('ajax-url', button.data('ajax-url') + day + '/');
        ajaxModals();
    } else {
        $('.corner-popup > img').remove();
        $('.corner-popup > h3').remove();
        $('.corner-popup > a').prop('class', '');
        $('.corner-popup > a').prependTo('.corner-popup > small');
        $('.corner-popup').width('auto');
        $('.corner-popup').css('padding', '5px 10px');
        $('.corner-popup > small').css('padding', '0');
    }
}

function aprilFools() {
    let today = new Date();
    // Check it's april 1st
    if ((today.getMonth() + 1) == 4 && today.getDate() == 1) {
        if (window.location.pathname.indexOf('/login') !== -1) {
            return;
        }
        $('.corner-popup').remove();
        let conf = aprilfools_configuration;
        let css = '.speech-bubble {\
	position: relative;\
	background: ' + conf.bubbleColor + ';\
	border-radius: .4em;\
    color: white;\
    padding: 10px;\
    text-align: center;\
    font-size: 1.5em;\
}\
\
.speech-bubble:after {\
	content: \'\';\
	position: absolute;\
	right: 0;\
	top: 50%;\
	width: 0;\
	height: 0;\
	border: 47px solid transparent;\
	border-left-color: ' + conf.bubbleColor + ';\
	border-right: 0;\
	border-bottom: 0;\
	margin-top: -23.5px;\
	margin-right: -47px;\
}\
.speech-bubble.end {\
    background: ' + conf.bubbleColor + ';\
    padding: 30px 10px;\
}\
.speech-bubble.end:after {\
    border-left-color: ' + conf.bubbleColor + ';\
}\
.aprilFoolsPopup {\
    position: fixed;\
    z-index: 3000;\
    bottom: 20px;\
    left: 20px;\
    max-width: 100%;\
    background-color: rgba(255, 255, 255, 0.95);\
    border-radius: 10px;\
    padding: 20px 30px;\
    border: 2px solid white;\
    box-shadow: 0px 0px 30px 2px rgba(0, 0, 0, 0.2);\
}\
';
        injectStyles(css);

        let gameDismissed = localStorage['aprilFoolDismissed' + today.getYear()] || false;
        let gameEnded = localStorage['aprilFoolEnded' + today.getYear()] || false;
        if (gameDismissed || gameEnded) {
            return;
        }
        if (typeof(aprilFoolsTakeOverDivs) != 'undefined') {
            aprilFoolsTakeOverDivs();
        }

        function getItem(same, small) {
            return '<img src="' + conf.items[(same ? 0 : Math.floor(Math.random() * conf.items.length))] + '" alt="item"' + (small ? ' style="height: 20px;"' : '') + (conf.itemSize ? ' style="height: ' + conf.itemSize + ';"' : '') + ' />';
        }

        function endGameModal() {
            $.ajax({
                url: '/ajax/endaprilfool/',
                success: function(data) {
                    if ('already_got' in data) {
                        $('#freeModal .afterbadge').show();
                        if ('added' in data) {
                            $('#freeModal .afterbadge').after(
                                '<br><p class="alert alert-info fontx0-8">\
Congratulations, you\'re the <b>' + ordinal_suffix_of(data['already_got'] + 1)
                                    + '</b> player who completed this challenge!</p>');
                        }
                    }
                },
            });
            let modalEndContent = $('\
<div class="row">\
<div class="col-md-6 col-xs-8">\
<div class="endText"><div class="speech-bubble end" style="background-color: ' + conf.bubbleColor + ';">' + conf.endBubbleText + '</div><br><div class="fontx1-5 text-center">' + conf.endText + '</div><div class="text-center afterbadge" style="display: none;"><br>' + conf.afterBadgeText + '<br><br><div class="text-center"><a href="/me/?open=badge" class="btn btn-main btn-lg btn-lines">Check it out <i class="flaticon-link fontx0-5"></i></a></div></div></div></div>\
<div class="col-md-6 col-xs-4">\
<img src="' + conf.endImage + '" alt="April fools" class="img-responsive" />\
</div>\
</div>\
');
            freeModal('April fools!', modalEndContent, 0, 'lg');
            $('#freeModal').on('hidden.bs.modal', function() {
                location.reload();
            });
        }

        function gameStartedPop() {
            let totalFound = 0;
            let onPage = 0;
            let hintable = [];
            $.each(conf.hiddenAfterDivs, function(i, d) {
                let wasFound = localStorage['aprilFoolFound' + today.getYear() + '' + i] || false;
                if (wasFound) {
                    totalFound += 1;
                } else {
                    if ($(d[0]).length > 0) {
                        onPage += 1;
                        let toClick = $('<a href="#" class="padding10">' + getItem() + '</a>');
                    toClick.click(function(e) {
                        e.preventDefault();
                        toClick.remove();
                        localStorage['aprilFoolFound' + today.getYear() + '' + i] = true;
                        totalFound += 1;
                        $('.aprilFoolsPopup .found').text(totalFound);
                        onPage -= 1;
                        $('.aprilFoolsPopup .hint').html(getHint());
                        if (totalFound == totalToFind) {
                            // End of game!
                            localStorage['aprilFoolEnded' + today.getYear()] = true;
                            endGameModal();
                        }
                        return false;
                    });
                        $(d[0]).first().after(toClick);
                    } else { // not on page
                        hintable.push(d[1])
                    }
                }
            });

            function getHint() {
                let showHint = localStorage['aprilFoolShowHint' + today.getYear()] || false;
                if (!showHint) {
                    return '?';
                } else {
                    if (onPage > 0) {
                        return (': I see ' + onPage + getItem(true, true) + '!');
                    } else {
                        let hintCounter = parseInt(localStorage['aprilFoolShowHint' + today.getYear()]) || 0;
                        if (hintCounter >= 2) {
                            localStorage['aprilFoolShowHint' + today.getYear()] = 0;
                            return ': ' + hintable[Math.floor(Math.random() * hintable.length)];
                        } else {
                            localStorage['aprilFoolShowHint' + today.getYear()] = hintCounter + 1;
                            return ': Nothing to see here...';
                        }
                    }
                }
            }

            let totalToFind = conf.hiddenAfterDivs.length;

            let popup = $('<div class="aprilFoolsPopup"><a href="#close" class="text-muted pull-right a-nodifference" style="padding-left: 20px;"><small>x</small></a>\
You found <span class="found">' + totalFound + '</span> / <span>' + totalToFind + '</span> ' + getItem(true) + '<br>\
<a href="#getHint" class="a-nodifference fontx0-8"><i class="flaticon-idea"></i> Hint<span class="hint">' + getHint() + '</span></a>\
</div>');
            popup.find('[href="#close"]').click(function(e) {
                popup.hide('fast');
            });
            popup.find('[href="#getHint"]').click(function(e) {
                e.preventDefault();
                let showHint = localStorage['aprilFoolShowHint' + today.getYear()] || false;
                if (showHint) {
                    localStorage.removeItem('aprilFoolShowHint' + today.getYear());
                    popup.find('.hint').html(getHint());
                } else {
                    localStorage['aprilFoolShowHint' + today.getYear()] = true;
                    popup.find('.hint').html(getHint());
                }
                return false;
            });
            $('body').append(popup);
        }

        let gameStarted = localStorage['aprilFoolStarted' + today.getYear()] || false;
        if (gameStarted) {
            gameStartedPop();
        } else {
            let buttons = '<div class="text-center">\
<a href="' + (is_authenticated ? '#play' : '/login/') + '" class="btn btn-main btn-xl btn-lines">' + conf.startButton + '</a><br>\
<a href="#dismiss" class="btn btn-link-muted">Not interested</a></div>';
            let modalContent = $('\
<div class="row">\
<div class="col-md-6 col-xs-8">\
' + (conf.startBubbleText ? '<div class="speech-bubble">' + conf.startBubbleText.replace('{site_name}', site_name) + '</div><br>' : '') + '\
<quote class="fontx1-5">' + conf.startText + '</quote>\
<br><br><br>' + buttons + '</p>\
</div>\
<div class="col-md-6 col-xs-4">\
<img src="' + conf.startImage + '" alt="April fools" class="img-responsive" />\
</div>\
</div>\
');
            modalContent.find('[href="#dismiss"]').click(function(e) {
                e.preventDefault();
                localStorage['aprilFoolDismissed' + today.getYear()] = true;
                location.reload();
                return false;
            });
            modalContent.find('[href="#play"]').click(function(e) {
                e.preventDefault();
                localStorage['aprilFoolStarted' + today.getYear()] = true;
                gameStarted = true;
                gameStartedPop();
                $('#freeModal').modal('hide');
                return false;
            });
            freeModal('April fools!', modalContent, 0, 'lg');
        }
    }
}

// *****************************************
// Wiki

function linkRendererTitle(link, title) {
    if (current.endsWith('_ajax')) {
        return '<a href="/' + current.slice(0, -5) + '/' + link + '/" class="internal-wiki-link" data-ajax-url="/ajax/' + current.slice(0, -5) + '/' + link + '/">' + title + '</a>';
    } else {
        return '<a href="/' + current + '/' + link + '/" class="internal-wiki-link">' + title + '</a>';
    }
}

function linkRenderer(link) {
    return linkRendererTitle(link, link);
}

function afterLoadWiki(page) {
    // Open external links in new page
    page.find('a:not(.internal-wiki-link):not([href^="#"])').attr("target", "_blank");
}

function _loadWikiPage() {
    var wikiPageName = wiki_url;
    var wikiPageUrl = githubwiki.getGithubName(wikiPageName);

    githubwiki.setMarkedOptions({
        internalLink: linkRenderer,
        internalLinkTitle: linkRendererTitle,
    });

    githubwiki.setWiki(github_repository_username, github_repository_name);

    // Sidebar
    if ($('#wiki-sidebar').length > 0) {
        $('#wiki-sidebar').html('<div class="loader"><i class="flaticon-loading"></i></div>');
        githubwiki.get('_Sidebar.md', function(data) {
            $('#wiki-sidebar').html(data);
            afterLoadWiki($('#wiki-sidebar'));
        });
    }

    // Main page
    $('#wiki-content').html('<div class="loader"><i class="flaticon-loading"></i></div>');
    githubwiki.get(wikiPageUrl + '.md', function(data) {
        $('#wiki-content').html(data);
        afterLoadWiki($('#wiki-content'));
        ajaxModals();
        loadMarkdown();
    });

    $('.edit-link').attr('href', 'https://github.com/' + github_repository_username + '/' + github_repository_name + '/wiki/' + wikiPageUrl + '/_edit');
}

function loadWikiPage() {
    function _loadGitHubWiki() {
        if (typeof githubwiki == 'undefined') {
            $.getScript(static_url + 'bower/github-wiki/js/githubwiki.js', _loadWikiPage);
        } else {
            _loadWikiPage();
        }
    }
    if (typeof marked == 'undefined') {
        $.getScript(static_url + 'bower/marked/lib/marked.js', _loadGitHubWiki);
    } else {
        _loadGitHubWiki();
    }
}
