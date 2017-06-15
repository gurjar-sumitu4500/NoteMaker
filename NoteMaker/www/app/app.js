/**
 * This is the applications main page which will control 
 * how the first page will look and how it will start
 */
$(function () {
    MyBox.notify.DEFAULTS = $.extend({}, MyBox.notify.DEFAULTS, {
        size: 'mini',
        position: 'right top'
    });

    
    //Customising datepicker
    $('#todo-lists-app-datepicker').MyList({
        lists: [
            {
                title: 'Notes',
                defaultStyle: 'Mylist-info',
                items: [
                    {
                        title: 'My New Note',
                        description: 'This is a New Note made by me.',
                        dueDate: '2017-02-30'
                    },
					{
                        title: 'My New Note 2',
                        description: 'This is another note Made By me.',
                        dueDate: '2016-07-05'
                    },
					{
                        title: 'Try Delete Me',
                        description: 'Click on delete Button.',
                        dueDate: '2015-05-08'
                    },
					{
                        title: 'Try Edit',
                        description: 'Click on the Edit Button',
                        dueDate: '2018-04-16'
                    },
					{
                        title: 'Drag And Drop',
                        description: 'Drag me to another list',
                        dueDate: '2018-04-16'
                    }
                ]
            }
			
        ],
        afterListAdd: function(Mylist, list){
            var $dueDateInput = list.$el.find('form [name=dueDate]');
            $dueDateInput.datepicker();
        }
    });
    
    $('#actions-by-ajax').MyList({
        actions: {
            load: 'app/example1/load.json',
            insert: 'app/example1/insert.php',
            delete: 'app/example1/delete.php',
            update: 'app/example1/update.php'
        },
        afterItemAdd: function(){
            console.log(arguments);
        }
    });
});