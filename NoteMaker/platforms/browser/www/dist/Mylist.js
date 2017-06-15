/*  This is the My list page which will contains all the functions 
 *  Required by our application.
*/
$(function () {

    var LIST_COUNTER = 0;
    var List = function ($MyList, options) {
        this.$MyList = $MyList;
        this.$options = options;
        this.$globalOptions = $MyList.$options;
        this.$items = {};

        this._init();
    };

    List.prototype = {
        $MyList: null,
        $el: null,
        $elWrapper: null,
        $options: {},
        $items: {},
        $globalOptions: {},
        $ul: null,
        $header: null,
        $title: null,
        $form: null,
        $footer: null,
        $body: null,

        eventsSuppressed: false,
        _init: function () {   /*This ia a private Function*/
			var me = this;
            me.suppressEvents();
            if (!me.$options.id) {
                me.$options.id = 'Mylist-list-' + (LIST_COUNTER++);
            }
            var $wrapper = $('<div class="Mylist-wrapper"></div>');
            var $div = $('<div id="'+me.$options.id+'" class="Mylist"></div>').appendTo($wrapper);

            if (me.$options.defaultStyle) {
                $div.addClass(me.$options.defaultStyle);
            }
            me.$el = $div;
            me.$elWrapper = $wrapper;
            me.$header = me._createHeader();
            me.$title = me._createTitle();
            me.$body = me._createBody();
            me.$ul = me._createList();
            if (me.$options.items) {
                me._createItems(me.$options.items);
            }
            me.$form = me._createForm();
            me.$body.append(me.$ul, me.$form);
            me.$footer = me._createFooter();
            if (me.$globalOptions.sortable) {
                me._enableSorting();
            }
            me.resumeEvents();
        },

        /**
         * If insert action is provided  a request will be sent to the server  
		 *if response is succes the value is provided otherwise error will be shown
         */
        addItem: function (item, errorCallback) {
			var me = this;
            if (me._triggerEvent('beforeItemAdd', [me, item]) === false) {
                return me;
            }

            item = me._processItemData(item);
            if (me.$globalOptions.actions.insert) {
                $.ajax(me.$globalOptions.actions.insert, {
                    data: item,
                    method: 'POST'
                })
                    .done(function (res) {
                        if (res.success) {
                            item.id = res.id;
                            me._addItemToList(item);
                        } else {
                            if (errorCallback && typeof errorCallback === 'function') {
                                errorCallback(res)
                            }
                        }
                    });
            } else {
                item.id = me.$MyList.getNextId();
                me._addItemToList(item);
            }
            return me;
        },

        /**
         * Below is the funtion for update item.
         */
        updateItem: function (item, errorCallback) {
			var me = this;
            if (me._triggerEvent('beforeItemUpdate', [me, item]) === false) {
                return me
            }
            if (me.$globalOptions.actions.update) {
                $.ajax(me.$globalOptions.actions.update, {
                    data: item,
                    method: 'POST'
                })
                    .done(function (res) {
                        if (res.success) {
                            me._updateItemInList(item);
                        } else {
                            if (errorCallback && typeof errorCallback === 'function') {
                                errorCallback(res)
                            }
                        }
                    });
            } else {
                me._updateItemInList(item);
            }
            return me;
        },

        /**
         * Below is the function for deleting item and if action.delete is called. 
		 */
        deleteItem: function (item, errorCallback) {
			var me = this;
            if (me._triggerEvent('beforeItemDelete', [me, item]) === false) {
                return me
            }
            if (me.$globalOptions.actions.delete) {
                return me._sendAjax(me.$globalOptions.actions.delete, {
                    data: item,
                    method: 'POST'
                })
                    
                    .done(function (res) {
                        if (res.success) {
                            me._removeItemFromList(item);
                        } else {
                            if (errorCallback && typeof errorCallback === 'function') {
                                errorCallback(res)
                            }
                        }
                    });
            } else {
                me._removeItemFromList(item);
            }
            return me;
        },

        /**
         * Below function is for updating an item in the server if the item id
         * is already given then it update the item otherwise new item will be created		 
		 */
        saveOrUpdateItem: function (item, errorCallback) {
			var me = this;
            if (item.id) {
                me.updateItem(item, errorCallback);
            } else {
                me.addItem(item, errorCallback);
            }
            return me;
        },

        /**
         * Below function is for editing the title
         */
        startTitleEditing: function () {
			var me = this;
            var input = me._createInput();
            me.$title.attr('data-old-title', me.$title.html());
            input.val(me.$title.html());
            input.insertAfter(me.$title);
            me.$title.addClass('hide');
            me.$header.addClass('title-editing');
            input[0].focus();
            input[0].select();
            return me;
        },

        /**
         * Finishing the title editing function
         */
        finishTitleEditing: function () {
			var me = this;
            var $input = me.$header.find('input');
            var oldTitle = me.$title.attr('data-old-title');
            me.$title.html($input.val()).removeClass('hide').removeAttr('data-old-title');
            $input.remove();
            me.$header.removeClass('title-editing');
            console.log(oldTitle, $input.val());
            me._triggerEvent('titleChange', [me, oldTitle, $input.val()]);
            return me;
        },

        /**
         * Below Function is for cancelling the title editing
         */
        cancelTitleEditing: function () {
			var me = this;
            var $input = me.$header.find('input');
            if ($input.length === 0) {
                return me;
            }
            me.$title.html(me.$title.attr('data-old-title')).removeClass('hide');
            $input.remove();
            me.$header.removeClass('title-editing');
            return me;
        },

        /**
         * Below Function is for removing a list
         */
        remove: function () {
			var me = this;
            me.$MyList.$lists.splice(me.$el.index(), 1);
            me.$elWrapper.remove();

            return me;
        },

        /**
         * This funstion is for editing the items
         */
        editItem: function (id) {
			var me = this;
            var $item = me.$MyList.$el.find('li[data-id=' + id + ']');
            var $form = $item.closest('.Mylist').find('.Mylist-add-todo-form');
            var $footer = $item.closest('.Mylist').find('.Mylist-footer');

            $form.removeClass('hide');
            $footer.addClass('hide');
            $form[0].id.value = $item.attr('data-id');
            $form[0].title.value = $item.find('.Mylist-item-title').html();
            $form[0].description.value = $item.find('.Mylist-item-description').html() || '';
            $form[0].dueDate.value = $item.find('.Mylist-item-duedate').html() || '';
            return me;
        },

        /**
         * Events will not be triggered until we call events
         */
        suppressEvents: function(){
            this.eventsSuppressed = true;
            return this;
        },

        /**
         * Resuming all the events.
         */
        resumeEvents: function(){
            this.eventsSuppressed = false;
            return this;
        },

        _processItemData: function (item) {
			var me = this;
            return $.extend({}, me.$globalOptions.itemOptions, item);
        },

        _createHeader: function () {
			var me = this;
            var $header = $('<div>', {
                'class': 'Mylist-header'
            });
            var $actions = $('<div>', {
                'class': 'Mylist-actions'
            }).appendTo($header);
            if (me.$options.controls && me.$options.controls.length > 0) {
                if (me.$options.controls.indexOf('styleChange') > -1) {
                    $actions.append(me._createDropdownForStyleChange());
                }

                if (me.$options.controls.indexOf('edit') > -1) {
                    $actions.append(me._createEditTitleButton());
                    $actions.append(me._createFinishTitleEditing());
                    $actions.append(me._createCancelTitleEditing());
                }
                if (me.$options.controls.indexOf('add') > -1) {
                    $actions.append(me._createAddNewButton());
                }
                if (me.$options.controls.indexOf('remove') > -1) {
                    $actions.append(me._createCloseButton());
                }
            }
            me.$el.append($header);
            return $header;
        },

        _createTitle: function () {
			var me = this;
            var $title = $('<div>', {
                'class': 'Mylist-title',
                html: me.$options.title
            }).appendTo(me.$header);
            if (me.$options.controls && me.$options.controls.indexOf('edit') > -1) {
                $title.on('dblclick', function () {
                    me.startTitleEditing();
                });
            }
            return $title;
        },

        _createBody: function () {
			var me = this;
            return $('<div>', {
                'class': 'Mylist-body'
            }).appendTo(me.$el);

        },
  
        /*
		* This function is called to create a form 
	   */
        _createForm: function () {
			var me = this;
            var $form = $('<form>', {
                'class': 'Mylist-add-todo-form hide'
            });
            $('<input type="hidden" name="id">').appendTo($form);
            $('<div class="form-group">').append(
                $('<input>', {
                    'type': 'text',
                    name: 'title',
                    'class': 'form-control',
                    placeholder: 'TODO title'
                })
            ).appendTo($form);
            $('<div class="form-group">').append(
                $('<textarea>', {
                    rows: '2',
                    name: 'description',
                    'class': 'form-control',
                    'placeholder': 'TODO description'
                })
            ).appendTo($form);
            $('<div class="form-group">').append(
                $('<input>', {
                    'type': 'text',
                    name: 'dueDate',
                    'class': 'form-control',
                    placeholder: 'Due Date'
                })
            ).appendTo($form);
            var $ft = $('<div class="Mylist-form-footer">');
            $('<button>', {
                'class': 'btn btn-primary btn-sm btn-add-todo',
                html: 'Add'
            }).appendTo($ft);
            $('<button>', {
                type: 'button',
                'class': 'btn btn-default btn-sm btn-discard-todo',
                html: '<i class="glyphicon glyphicon-remove-circle"></i>'
            }).click(function () {
                $form.addClass('hide');
                me.$footer.removeClass('hide');
            }).appendTo($ft);
            $ft.appendTo($form);

            me._formHandler($form);

            me.$el.append($form);
            return $form;
        },

        _formHandler: function ($form) {
			var me = this;
            $form.on('submit', function (ev) {
                ev.preventDefault();
                me._submitForm();
            });
        },
        
		/*
		* This Funstion is for Submitting the form
	   */
        _submitForm: function () {
			var me = this;
            if (!me.$form[0].title.value) {
                me._showFormError('title', 'Title can not be empty');
                return;
            }
            me.saveOrUpdateItem({
                id: me.$form[0].id.value,
                title: me.$form[0].title.value,
                description:me. $form[0].description.value,
                dueDate: me.$form[0].dueDate.value
            });
            me.$form.addClass('hide');
            me.$footer.removeClass('hide');
        },
      
	   /* 
	   * This Function is for creating a footer
	   */
        _createFooter: function () {
			var me = this;
            var $footer = $('<div>', {
                'class': 'Mylist-footer'
            });
            $('<button>', {
                type: 'button',
                'class': 'btn-link btn-show-form',
                'html': 'Add new'
            }).click(function () {
                me._resetForm();
                me.$form.removeClass('hide');
                $footer.addClass('hide');
            }).appendTo($footer);
            me.$el.append($footer);
            return $footer;
        },
        
		/*
		* This Function is for creating a list
	   */
        _createList: function () {
			var me = this;
            var $list = $('<ul>', {
                'class': 'Mylist-items'
            });
            me.$el.append($list);
            return $list;
        },

		/*
		* This Funstion is for creating a list item
	   */
        _createItems: function (items) {
			var me = this;
            for (var i = 0; i < items.length; i++) {
                me._addItem(items[i]);
            }
        },

        /**
         * This Funstion is for initializing the plugins
         */
        _addItem: function (item) {
			var me = this;
            if (!item.id) {
                item.id = me.$MyList.getNextId();
            }
            if (me._triggerEvent('beforeItemAdd', [me, item]) !== false) {
                item = me._processItemData(item);
                me._addItemToList(item);
            }
        },

        _createCheckbox: function () {
			var me = this;
            var $item = $('<input>', {
                'type': 'checkbox'
            });

            $item.change(function(){
                me._onCheckboxChange(this);
            });
            return $('<label>', {
                'class': 'checkbox-inline Mylist-check'
            }).append($item);
        },

        _onCheckboxChange: function (checkbox) {
			var me = this;
            var $this = $(checkbox);
            if ($this.prop('checked')) {
                me._triggerEvent('afterMarkAsDone', [me, $this])
            } else {
                me._triggerEvent('afterMarkAsUndone', [me, $this])
            }

            $this.closest('.Mylist-item').toggleClass('item-done');
        },

        _createDropdownForStyleChange: function () {
			var me = this;
            var $dropdown = $('<div>', {
                'class': 'dropdown'
            }).append(
                $('<button>', {
                    'type': 'button',
                    'data-toggle': 'dropdown',
                    'class': 'btn btn-default btn-xs',
                    'html': '<i class="glyphicon glyphicon-th"></i>'
                })
            );
            var $menu = $('<div>', {
                'class': 'dropdown-menu dropdown-menu-right'
            }).appendTo($dropdown);

            for (var i = 0; i < me.$globalOptions.listStyles.length; i++) {
                var st = me.$globalOptions.listStyles[i];
                $('<div class="' + st + '"></div>')
                    .on('mousedown', function (ev) {
                        ev.stopPropagation()
                    })
                    .click(function () {
                        var classes = me.$el[0].className.split(' ');
                        var oldClass = null;
                        for (var i = 0; i < classes.length; i++) {
                            if (me.$globalOptions.listStyles.indexOf(classes[i]) > -1) {
                                oldClass = classes[i];
                            }
                        }
                        me.$el.removeClass(me.$globalOptions.listStyles.join(" "))
                            .addClass(this.className);

                        me._triggerEvent('styleChange', [me, oldClass, this.className]);

                    })
                    .appendTo($menu);
            }
            return $dropdown;
        },

        _createEditTitleButton: function () {
			var me = this;
            var $btn = $('<button>', {
                'class': 'btn btn-default btn-xs',
                html: '<i class="glyphicon glyphicon-edit"></i>'
            });
            $btn.click(function () {
                me.startTitleEditing();
            });

            return $btn;
        },

        _createAddNewButton: function () {
			var me = this;
            var $btn = $('<button>', {
                'class': 'btn btn-default btn-xs',
                html: '<i class="glyphicon glyphicon-plus"></i>'
            });
            $btn.click(function () {
                var list = me.$MyList.addList();
                list.startTitleEditing();
            });
            return $btn;
        },

        _createCloseButton: function () {
			var me = this;
            var $btn = $('<button>', {
                'class': 'btn btn-default btn-xs',
                html: '<i class="glyphicon glyphicon-remove"></i>'
            });
            $btn.click(me._onRemoveListClick);
            return $btn;
        },

        _onRemoveListClick: function () {
			var me = this;
            me._triggerEvent('beforeListRemove', [me]);
            me.remove();
            me._triggerEvent('afterListRemove', [me]);
            return me;
        },

        _createFinishTitleEditing: function () {
			var me = this;
            var $btn = $('<button>', {
                'class': 'btn btn-default btn-xs btn-finish-title-editing',
                html: '<i class="glyphicon glyphicon-ok-circle"></i>'
            });
            $btn.click(function () {
                me.finishTitleEditing();
            });
            return $btn;
        },

        _createCancelTitleEditing: function () {
			var me = this;
            var $btn = $('<button>', {
                'class': 'btn btn-default btn-xs btn-cancel-title-editing',
                html: '<i class="glyphicon glyphicon-remove-circle"></i>'
            });
            $btn.click(function () {
                me.cancelTitleEditing();
            });
            return $btn;
        },

        _createInput: function () {
			var me = this;
            var input = $('<input type="text" class="form-control">');
            input.on('keyup', function (ev) {
                if (ev.which === 13) {
                    me.finishTitleEditing();
                }
            });
            return input;
        },

        _showFormError: function (field, error) {
            var $fGroup = this.$form.find('[name="' + field + '"]').closest('.form-group')
                .addClass('has-error');
            $fGroup.find('.help-block').remove();
            $fGroup.append(
                $('<span class="help-block">'+error+'</span>')
            );
        },

        _resetForm: function () {
			var me = this;
            me.$form[0].reset();
            me.$form[0].id.value = "";
            me.$form.find('.form-group').removeClass('has-error').find('.help-block').remove();
        },

        _enableSorting: function () {
			var me = this;
            me.$el.find('.Mylist-items').sortable({
                connectWith: '.Mylist .Mylist-items',
                items: '.Mylist-item',
                handle: '.drag-handler',
                cursor: 'move',
                placeholder: 'Mylist-item-placeholder',
                forcePlaceholderSize: true,
                opacity: 0.9,
                revert: 70,
                update: function (event, ui) {
                    me._triggerEvent('afterItemReorder', [me, ui.item]);
                }
            });
        },

        _addItemToList: function (item) {
			var me = this;
            var $li = $('<li>', {
                'data-id': item.id,
                'class': 'Mylist-item'
            });
            $li.append($('<div>', {
                'class': 'Mylist-item-title',
                'html': item.title
            }));
            if (item.description) {
                $li.append($('<div>', {
                    'class': 'Mylist-item-description',
                    html: item.description
                }));
            }
            if (item.dueDate) {
                $li.append($('<div>', {
                    'class': 'Mylist-item-duedate',
                    html: item.dueDate
                }));
            }
            $li = me._addItemControls($li);
            if (item.done) {
                $li.find('input[type=checkbox]').prop('checked', true);
                $li.addClass('item-done');
            }
            $li.data('lobiListItem', item);
            me.$ul.append($li);
            me.$items[item.id] = item;
            me._triggerEvent('afterItemAdd', [me, item]);

            return $li;
        },

        _addItemControls: function ($li) {
			var me = this;
            if (me.$options.useCheckboxes) {
                $li.append(me._createCheckbox());
            }
            var $itemControlsDiv = $('<div>', {
                'class': 'todo-actions'
            }).appendTo($li);

            if (me.$options.enableTodoEdit) {
                $itemControlsDiv.append($('<div>', {
                    'class': 'edit-todo todo-action',
                    html: '<i class="glyphicon glyphicon-pencil"></i>'
                }).click(function () {
                    me.editItem($(this).closest('li').data('id'));
                }));
            }

            if (me.$options.enableTodoRemove) {
                $itemControlsDiv.append($('<div>', {
                    'class': 'delete-todo todo-action',
                    html: '<i class="glyphicon glyphicon-remove"></i>'
                }).click(function () {
                    me._onDeleteItemClick($(this).closest('li').data('lobiListItem'));
                }));
            }

            $li.append($('<div>', {
                'class': 'drag-handler'
            }));
            return $li;
        },

        _onDeleteItemClick: function (item) {
            this.deleteItem(item);
        },

        _updateItemInList: function (item) {
			var me = this;
            var $li = me.$MyList.$el.find('li[data-id="' + item.id + '"]');
            $li.find('input[type=checkbox]').prop('checked', item.done);
            $li.find('.Mylist-item-title').html(item.title);
            $li.find('.Mylist-item-description').remove();
            $li.find('.Mylist-item-duedate').remove();

            if (item.description) {
                $li.append('<div class="Mylist-item-description">' + item.description + '</div>');
            }
            if (item.dueDate) {
                $li.append('<div class="Mylist-item-duedate">' + item.dueDate + '</div>');
            }
            $li.data('lobiListItem', item);
            $.extend(me.$items[item.id], item);
            me._triggerEvent('afterItemUpdate', [me, item]);
        },

        _triggerEvent: function (type, data) {
			var me = this;
            if (me.eventsSuppressed){
                return;
            }
            if (me.$options[type] && typeof me.$options[type] === 'function') {
                return me.$options[type].apply(me, data);
            } else {
                return me.$el.trigger(type, data);
            }
        },

        _removeItemFromList: function (item) {
			var me = this;
            me.$MyList.$el.find('li[data-id=' + item.id + ']').remove();
            me._triggerEvent('afterItemDelete', [me, item]);
        },

        _sendAjax: function (url, params) {
			var me = this;
            return $.ajax(url, me._beforeAjaxSent(params))
        },

        _beforeAjaxSent: function (params) {
			var me = this;
            var eventParams = me._triggerEvent('beforeAjaxSent', [me, params]);
            return $.extend({}, params, eventParams || {});
        }
    };

    var MYList = function ($el, options) {
        this.$el = $el;
        this.init(options);
    };

    MYList.prototype = {
        $el: null,
        $lists: [],
        $options: {},
        _nextId: 1,

        eventsSuppressed: false,

        init: function (options) {
            var me = this;
            me.suppressEvents();

            me.$options = this._processInput(options);
            me.$el.addClass('Mylist');
            if (me.$options.onSingleLine) {
                me.$el.addClass('single-line');
            }

            me._createLists();
            me._handleSortable();
            me._triggerEvent('init', [me]);
            me.resumeEvents();
        },

       
        _processInput: function (options) {
            options = $.extend({}, $.fn.MyList.DEFAULT_OPTIONS, options);
            if (options.actions.load) {
                $.ajax(options.actions.load, {
                    async: false
                }).done(function (res) {
                    options.lists = res.lists;
                });
            }
            return options;
        },

        /**
         * This is a private function
         */
        _createLists: function () {
            var me = this;
            for (var i = 0; i < me.$options.lists.length; i++) {
                me.addList(me.$options.lists[i]);
            }
            return me;
        },

        _handleSortable: function () {
            var me = this;
            if (me.$options.sortable) {
                me.$el.sortable({
                    items: '.Mylist-wrapper',
                    handle: '.Mylist-header',
                    cursor: 'move',
                    placeholder: 'Mylist-placeholder',
                    forcePlaceholderSize: true,
                    opacity: 0.9,
                    revert: 70,
                    update: function (event, ui) {
                        me._triggerEvent('afterListReorder', [me, ui.item.find('.Mylist').data('MyList')]);
                    }
                });
            } else {
                me.$el.addClass('no-sortable');
            }
            return me;
        },

        /**
         * Below Funstion is for adding a new list
		 */
        addList: function (list) {
            var me = this;
            if (!(list instanceof List)) {
                list = new List(me, me._processListOptions(list));
            }
            if (me._triggerEvent('beforeListAdd', [me, list]) !== false) {
                me.$lists.push(list);
                me.$el.append(list.$elWrapper);
                list.$el.data('MyList', list);
                me._triggerEvent('afterListAdd', [me, list]);
            }
            return list;
        },

        /**
         * Destroy the <code>MYList</code>.
         */
        destroy: function () {
            var me = this;
            if (me._triggerEvent('beforeDestroy', [me]) !== false) {
                for (var i = 0; i < me.$lists.length; i++) {
                    me.$lists[i].remove();
                }
                if (me.$options.sortable) {
                    me.$el.sortable("destroy");
                }
                me.$el.removeClass('Mylist');
                if (me.$options.onSingleLine) {
                    me.$el.removeClass('single-line');
                }
                me.$el.removeData('MyList');
                me._triggerEvent('afterDestroy', [me]);
            }

            return me;
        },

        getNextId: function () {
            return this._nextId++;
        },

        _processListOptions: function (listOptions) {
            var me = this;
            listOptions = $.extend({}, me.$options.listsOptions, listOptions);

            for (var i in me.$options) {
                if (me.$options.hasOwnProperty(i) && listOptions[i] === undefined) {
                    listOptions[i] = me.$options[i];
                }
            }
            return listOptions;
        },

        suppressEvents: function(){
            this.eventsSuppressed = true;
            return this;
        },

        resumeEvents: function(){
            this.eventsSuppressed = false;
            return this;
        },

        
        _triggerEvent: function (type, data) {
            var me = this;
            if (me.eventsSuppressed){
                return;
            }
            if (me.$options[type] && typeof me.$options[type] === 'function') {
                return me.$options[type].apply(me, data);
            } else {
                return me.$el.trigger(type, data);
            }
        }
    };

    $.fn.MyList = function (option) {
        var args = arguments;
        var ret;
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('MyList');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('MyList', (data = new MYList($this, options)));
            }
            if (typeof option === 'string') {
                args = Array.prototype.slice.call(args, 1);
                ret = data[option].apply(data, args);
            }
        });
    };
    $.fn.MyList.DEFAULT_OPTIONS = {
        
        'listStyles': ['Mylist-default', 'Mylist-danger', 'Mylist-success', 'Mylist-warning', 'Mylist-info', 'Mylist-primary'],
        
        listsOptions: {
            id: false,
            title: '',
            items: []
        },
        
        itemOptions: {
            id: false,
            title: '',
            description: '',
            dueDate: '',
            done: false
        },

        lists: [],
        
        actions: {
            'load': '',         /*  These are urls to communicate to backend*/
            'update': '',
            'insert': '',
            'delete': ''
        },
        
        useCheckboxes: true,        
        enableTodoRemove: true,        
        enableTodoEdit: true,
        sortable: true,        
        controls: ['edit', 'add', 'remove', 'styleChange'],        
        defaultStyle: 'Mylist-default',
        onSingleLine: true,
        init: null,
        beforeDestroy: null,
        afterDestroy: null,
        beforeListAdd: null,
        afterListAdd: null,
        beforeListRemove: null,
        afterListRemove: null,
        beforeItemAdd: null,
        afterItemAdd: null,
        beforeItemUpdate: null,
        afterItemUpdate: null,
        beforeItemDelete: null,
        afterItemDelete: null,
        afterListReorder: null,
        afterItemReorder: null,
        afterMarkAsDone: null,
        afterMarkAsUndone: null,
        beforeAjaxSent: null,
        styleChange: null,
        titleChange: null
    };
});