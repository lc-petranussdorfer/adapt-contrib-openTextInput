/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers
 * Thomas Eitler <thomas.eitler@learnchamp.com>
 * Barbara Fellner <me@barbarafellner.at>
 * Petra Nussdorfer <petra.nussdorfer@learnchamp.com>
 */

define(function(require) {

    var ComponentView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    // This should go in the view
    //var countCharacter = 0;


    var OpenTextInput = ComponentView.extend({

        events: {
            'click .openTextInput-save-button': 'onSaveClicked',
            'click .openTextInput-submit-button': 'onSubmitClicked',
            'click .openTextInput-model-button': 'onModelAnswerClicked',
            'click .openTextInput-clear-button': 'onClearClicked',
            'click .openTextInput-user-button': 'onUserAnswerClicked',
            'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
        },


        /*onKeyUpTextarea: function() {
            this.countCharacter();
        },

        countCharacter: function() {
            var charLengthOfTextarea = this.$('.opentextinput-item-textbox').val().length;
            var allowedCharacters = this.model.get('allowedCharacters');
            if (allowedCharacters != null) {
                var charactersLeft = allowedCharacters - charLengthOfTextarea;
                this.$('.countCharacters').html('Permitted number of characters left: ' + charactersLeft);
            } else {
                this.$('.countCharacters').html('Number of Characters: ' + charLengthOfTextarea);
            }
        },*/

        preRender: function() {

            this.setupDefaultSettings();
            this.resetQuestion({
                resetAttempts: true,
                initialisingScreen: true
            });

            this.listenTo(Adapt, 'device:changed', this.calculateWidths, this);
            this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

            this.setDeviceSize();



            // we do not need feedbackarrays
            this.listenTo(this.model, 'change:_isEnabled', this.onEnabledChanged);


        },

        postRender: function() {
            this.setReadyStatus();
            this.setCompletionStatus();

            // Read the last saved answer and paste it into the textarea
            this.$('.opentextinput-item-textbox').val(this.getUserAnswer());

            this.countCharacter();

            if ((this.model.get('_layout') == 'right') || (this.model.get('_layout') == 'left')) {
                this.$('.opentextinput-useranswer').css('width', '100%');
                this.$('.opentextinput-modelanswer').css('width', '100%');
                this.$('.opentextinput-modelanswer').css('display', 'none');
                this.$('.model').css('visibility', 'visible');
            } else {
                this.$('.model').css('visibility', 'hidden');

            }

        },

        /*calculateWidths: function() {

    if (this.model.get('_isSubmitted') && this.model.get('modelAnswer') != '') {

        if (Adapt.device.screenSize != 'large') {
            this.$('.opentextinput-useranswer').css('width', '100%');
            this.$('.opentextinput-modelanswer').css('width', '100%');
            this.$('.opentextinput-modelanswer').css('display', 'none');
            this.$('.model').css('visibility', 'visible');
        } else {
            if ((this.model.get('_layout') == 'full')) {
                console.log('i am here in full large');
                this.$('.opentextinput-useranswer').css('width', '48%');
                this.$('.opentextinput-modelanswer').css('width', '48%');
                this.$('.opentextinput-modelanswer').css('display', 'inline-block');

                this.$('.opentextinput-useranswer').css('display', 'inline-block');
                this.$('.model').css('visibility', 'hidden');
            }
        }
    }

},
*/
        /*,

        setDeviceSize: function() {
            if (Adapt.device.screenSize === 'large') {
                this.model.set('_isDesktop', true);
            } else {
                this.model.set('_isDesktop', false)
            }
        },

        resizeControl: function() {
            this.setDeviceSize();
            this.calculateWidths();
        },
        setupDefaultSettings: function() {
            // initialize saved status
            this.model.set('_isSaved', false);

            QuestionView.prototype.setupDefaultSettings.apply(this);
        },
        supports_html5_storage: function() {
            // check for html5 local storage support
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        canSubmit: function() {
            // function copied from textInput component
            var canSubmit = true;
            if ($('.opentextinput-item-textbox').val() == '') {
                canSubmit = false;
            }
            return canSubmit;
        },
        forceFixedPositionFakeScroll: function() {
            // function copied from textInput component
            if (Modernizr.touch) {
                _.defer(function() {
                    window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
                });
            }
        },
        storeUserAnswer: function() {
            // store user answer from textarea to localstorage
            var userAnswer = this.$('.opentextinput-item-textbox').val();
            // use unique identifier to avoid collisions with other components
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

            if (this.supports_html5_storage()) {
                localStorage.setItem(identifier, userAnswer);
                this.model.set('_isSaved', true);
            } else {
                console.warn('No local storage available');
            }
        },
        onSaveClicked: function(event) {
            event.preventDefault();

            this.storeUserAnswer();

            var pushObject = {
                title: '',
                body: this.model.get('savedMessage'),
                _timeout: 2000,
                _callbackEvent: 'pageLevelProgress:stayOnPage'
            };


            Adapt.trigger('notify:push', pushObject);
        },

        onClearClicked: function(event) {
            event.preventDefault();

            var promptObject = {
                title: 'Clear Text',
                body: 'Do you really want to delete your written text?',
                _prompts: [{
                    promptText: 'Yes',
                    _callbackEvent: 'clickEvent:clearText',
                }, {
                    promptText: 'No',
                    _callbackEvent: 'pageLevelProgress:stayOnPage'
                }],
                _showIcon: true
            };


            Adapt.on('clickEvent:clearText', function() {
                // Error: Undefined is not a function
                this.clearTextarea();
            }, this);

            Adapt.trigger('notify:prompt', promptObject);

        },

        clearTextarea: function(event) {
            this.$('.opentextinput-item-textbox').val('');
            this.storeUserAnswer();

        },

        onSubmitClicked: function(event) {
            event.preventDefault();

            if (!this.canSubmit()) return;

            Adapt.tabHistory = $(event.currentTarget).parent('.inner');

            this.model.set({
                _isEnabled: false,
                _isSubmitted: true,
            });
            this.$('.component-widget').addClass('submitted user');

            var userAnswer = this.$('.opentextinput-item-textbox').val();
            this.model.set('_userAnswer', userAnswer);

            this.storeUserAnswer();

            if (this.model.get('modelAnswer') == '') {
                this.$('.button.model').addClass('hide-model');
                this.$('.button.user').addClass('hide-user');
            }

            var pushObject = {
                title: '',
                body: this.model.get('submittedMessage'),
                _timeout: 2000,
                _callbackEvent: 'pageLevelProgress:stayOnPage'
            };

            this.calculateWidths();

            Adapt.trigger('notify:push', pushObject);

        },
        onEnabledChanged: function() {
            this.$('.opentextinput-item-textbox').prop('disabled', !this.model.get('_isEnabled'));
        },
        onModelAnswerShown: function() {
            this.$('.opentextinput-item-textbox').val(this.model.get('modelAnswer'));

            if (this.model.get('_layout') === 'right' || this.model.get('_layout') === 'left' || (Adapt.device.screenSize != 'large')) {
                this.$('.opentextinput-useranswer').css('display', 'none');
                this.$('.opentextinput-modelanswer').css('display', 'inline-block');
                this.$('.user').css('visibility', 'visible');
            }


        },
        onUserAnswerShown: function() {
            this.$('.opentextinput-item-textbox').val(this.getUserAnswer());

            if (this.model.get('_layout') === 'right' || this.model.get('_layout') === 'left' || (Adapt.device.screenSize != 'large')) {
                this.$('.opentextinput-useranswer').css('display', 'inline-block');
                this.$('.opentextinput-modelanswer').css('display', 'none');
                this.$('.model').css('visibility', 'visible');
            }
        },
        getUserAnswer: function() {
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';
            var userAnswer = '';
            if (this.supports_html5_storage()) {
                userAnswer = localStorage.getItem(identifier);
            } else {
                console.warn('No local storage available');
            }
            return userAnswer;
        },
        onComplete: function(parameters) {
            this.model.set({
                _isComplete: true,
                _isEnabled: false,
            });
            this.$('.component-widget').addClass('disabled');
            // this.showMarking();
            this.showUserAnswer();
            Adapt.trigger('questionView:complete', this);
        },

        markQuestion: function() {}*/
    });

    Adapt.register('openTextInput', OpenTextInput);

});
