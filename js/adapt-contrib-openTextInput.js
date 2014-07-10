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
            'click .openTextInput-clear-button': 'onClearClicked',
            'click .openTextInput-action-button': 'onActionClicked',
            'keyup .openTextInput-item-textbox': 'onKeyUpTextarea'
        },

        preRender: function() {
            this.listenTo(this.model, 'change:_isSaved', this.onSaveChanged);
            this.listenTo(this.model, 'change:_userAnswer', this.onUserAnswerChanged);
            // Read the last saved answer and paste it into the textarea
            if (!this.model.get('_userAnswer')) {
                console.log('no user answer');
                var userAnswer = this.getUserAnswer();
                if (userAnswer) {
                    console.log('has s answer');
                    this.model.set('_userAnswer', userAnswer);
                }
            }
        },

        postRender: function() {
            //set component to ready
            this.$textbox = this.$('.openTextInput-item-textbox');
            this.countCharacter();
            this.setReadyStatus();
            if (this.model.get('_isComplete')) {
                this.disableButtons();
                this.disableTextarea();
                this.showUserAnswer();
            }



        },
        getUserAnswer: function() {
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';
            var userAnswer = '';

            if (this.supportsHtml5Storage()) {
                userAnswer = localStorage.getItem(identifier);
                if (userAnswer) {
                    return userAnswer;
                }
            } else {
                console.warn('No local storage available');
            }
            return false;
        },
        supportsHtml5Storage: function() {
            // check for html5 local storage support
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        countCharacter: function() {
            var charLengthOfTextarea = this.$textbox.val().length;
            var allowedCharacters = this.model.get('_allowedCharacters');
            if (allowedCharacters != null) {
                var charactersLeft = allowedCharacters - charLengthOfTextarea;
                this.$('.openTextInput-count-amount').html(charactersLeft);
            } else {
                this.$('.openTextInput-count-amount').html(charLengthOfTextarea);
            }
        },
        onKeyUpTextarea: function() {
            this.model.set('_isSaved', false);
            this.onUserAnswerChanged(null, this.$textbox.val());
            this.limitCharacters();
            this.countCharacter();
        },
        limitCharacters: function() {
            var allowedCharacters = this.model.get('_allowedCharacters');
            if (allowedCharacters != null && this.$textbox.val().length > allowedCharacters) {
                var substringValue = this.$textbox.val().substring(0, allowedCharacters);
                this.$textbox.val(substringValue);
            }
        },
        onSaveClicked: function(event) {
            event.preventDefault();
            this.storeUserAnswer();
            this.notifyUserAnswerIsSaved();
        },
        storeUserAnswer: function() {
            // use unique identifier to avoid collisions with other components
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

            if (this.supportsHtml5Storage()) {
                localStorage.setItem(identifier, this.$textbox.val());
            } else {
                console.warn('No local storage available');
            }
            console.log(this.$textbox.val());
            this.model.set('_userAnswer', this.$textbox.val());
            this.model.set('_isSaved', true);
        },
        notifyUserAnswerIsSaved: function() {
            var pushObject = {
                title: '',
                body: this.model.get('savedMessage'),
                _timeout: 2000,
                _callbackEvent: '_openTextInput'
            };
            Adapt.trigger('notify:push', pushObject);
        },
        onSaveChanged: function(model, changedValue) {
            this.$('.openTextInput-save-button').prop('disabled', changedValue);
        },
        onClearClicked: function(event) {
            event.preventDefault();

            var promptObject = {
                title: 'Clear Text',
                body: 'Do you really want to delete your written text?',
                _prompts: [{
                    promptText: 'Yes',
                    _callbackEvent: '_openTextInput:clearText',
                }, {
                    promptText: 'No',
                    _callbackEvent: '_openTextInput:keepText'
                }],
                _showIcon: true
            };

            Adapt.once('_openTextInput:clearText', function() {
                this.clearTextarea();
                this.onUserAnswerChanged(null, this.$textbox.val());
                this.countCharacter();
            }, this);
            Adapt.trigger('notify:prompt', promptObject);
        },
        clearTextarea: function(event) {
            this.$textbox.val('');
            this.model.set('_isSaved', false);
        },
        onUserAnswerChanged: function(model, changedValue) {
            if (changedValue) {
                this.$('.openTextInput-clear-button, .openTextInput-action-button')
                    .prop('disabled', false);
            } else {
                this.$('.openTextInput-clear-button, .openTextInput-action-button')
                    .prop('disabled', true);
            }
        },
        onActionClicked: function(event) {
            if (this.model.get('_isComplete')) {
                if (this.model.get('_buttonState') == 'model') {
                    this.showUserAnswer();
                } else {
                    this.showModelAnswer();
                }
            } else {
                this.submitAnswer();
            }
        },
        submitAnswer: function() {
            this.storeUserAnswer();
            this.disableButtons();
            this.disableTextarea();
            this.showUserAnswer();
            this.model.set('_isComplete', true);

            var pushObject = {
                title: '',
                body: this.model.get('submittedMessage'),
                _timeout: 2000,
                _callbackEvent: '_openTextInput:submitted'
            };

            Adapt.trigger('notify:push', pushObject);
        },
        disableTextarea: function() {
            this.$textbox.prop('disabled', true);
        },
        disableButtons: function() {
            this.$('.openTextInput-clear-button, .openTextInput-save-button')
                .prop('disabled', true);
        },
        updateActionButton: function(buttonText) {
            this.$('.openTextInput-action-button')
                .html(buttonText);
        },
        showModelAnswer: function() {
            this.model.set('_buttonState', 'model');
            this.updateActionButton(this.model.get('_buttons').showUserAnswer);
            this.$textbox.val(this.model.get('modelAnswer'));
        },
        showUserAnswer: function() {
            this.model.set('_buttonState', 'user');
            this.updateActionButton(this.model.get('_buttons').showModelAnswer);
            this.$textbox.val(this.model.get('_userAnswer'));
        }



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
        supportsHtml5Storage: function() {
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
            var userAnswer = this.$textbox.val();
            // use unique identifier to avoid collisions with other components
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';

            if (this.supportsHtml5Storage()) {
                localStorage.setItem(identifier, userAnswer);
                this.model.set('_isSaved', true);
                this.model.set('_userAnswer', userAnswer);
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
            this.$textbox.val('');
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

            var userAnswer = this.$textbox.val();
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
            this.$textbox.prop('disabled', !this.model.get('_isEnabled'));
        },
        onModelAnswerShown: function() {
            this.$textbox.val(this.model.get('modelAnswer'));

            if (this.model.get('_layout') === 'right' || this.model.get('_layout') === 'left' || (Adapt.device.screenSize != 'large')) {
                this.$('.opentextinput-useranswer').css('display', 'none');
                this.$('.opentextinput-modelanswer').css('display', 'inline-block');
                this.$('.user').css('visibility', 'visible');
            }


        },
        onUserAnswerShown: function() {
            this.$textbox.val(this.getUserAnswer());

            if (this.model.get('_layout') === 'right' || this.model.get('_layout') === 'left' || (Adapt.device.screenSize != 'large')) {
                this.$('.opentextinput-useranswer').css('display', 'inline-block');
                this.$('.opentextinput-modelanswer').css('display', 'none');
                this.$('.model').css('visibility', 'visible');
            }
        },
        getUserAnswer: function() {
            var identifier = this.model.get('_id') + '-OpenTextInput-UserAnswer';
            var userAnswer = '';

            if (this.supportsHtml5Storage()) {
                userAnswer = localStorage.getItem(identifier);
                if(userAnswer) {
                    return userAnswer;
                }
            } else {
                console.warn('No local storage available');
            }
            return false;
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
