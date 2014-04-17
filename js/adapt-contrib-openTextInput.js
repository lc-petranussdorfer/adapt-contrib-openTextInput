/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers - LearnChamp Petra Nussdorfer <petra.nussdorfer@learnchamp.com>
 */


define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    window.onbeforeunload = function(e) {
 			 return 'Möchten Sie fortfahren ohne zu speichern?';
		};

    var OpenTextInput = QuestionView.extend({
        events: {
            "click .opentextinput-widget .button.save": "onSaveClicked",
            "click .opentextinput-widget .button.submit": "onSubmitClicked",
            "click .opentextinput-widget .button.model": "onModelAnswerClicked",
            "click .opentextinput-widget .button.user": "onUserAnswerClicked",
            "change .opentextinput-item-textbox" : "onTextBoxChange"
        },

        onTextBoxChange: function(){
					
        },
        postRender: function() {


            // IMPORTANT! 
            // Both of the following methods need to be called inside your view.

            // Use this to set the model status to ready. 
            // It should be used when telling Adapt that this view is completely loaded.
            // This is sometimes used in conjunction with imageReady.
            this.setReadyStatus();

            // Use this to set the model status to complete.
            // This can be used with inview or when the model is set to complete/the question has been answered.
            this.setCompletionStatus();

            // Read the last saved answer and paste it into the textarea
            this.$(".opentextinput-item-textbox").val(this.getUserAnswer());

            QuestionView.prototype.postRender.apply(this);            
        },
        preRender: function() {
            this.setupDefaultSettings();            
            this.resetQuestion({resetAttempts:true, initialisingScreen:true});
            // we do not need feedbackarrays
            this.listenTo(this.model, 'change:_isEnabled', this.onEnabledChanged);
        },
        setupDefaultSettings: function() {
            // initialize saved status
            this.model.set("_isSaved", false);
            
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
            if ($(".opentextinput-item-textbox").val() == "") {
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
            var userAnswer = this.$(".opentextinput-item-textbox").val();
            // use unique identifier to avoid collisions with other components
            var identifier = this.model.get('_id') + "-OpenTextInput-UserAnswer";
            
            if (this.supports_html5_storage()) {                
                localStorage.setItem(identifier, userAnswer);
                this.model.set("_isSaved", true);
            } else {
                console.warn("No local storage available");
            }
        },
        onSaveClicked: function(event) {
        	console.log(this.model.get("_isSaved"));
            event.preventDefault();
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
            this.$(".component-widget").addClass("submitted user");

            this.storeUserAnswer();
            this.showFeedback();
            // no marks for this question
        },
        onEnabledChanged: function() {
            this.$('.opentextinput-item-textbox').prop('disabled', !this.model.get('_isEnabled'));
        },
        onModelAnswerShown: function() {
            this.$(".opentextinput-item-textbox").val(this.model.get('modelAnswer'));
        },
        onUserAnswerShown: function() {            
            this.$(".opentextinput-item-textbox").val(this.getUserAnswer());
        },
        getUserAnswer: function () {
            var identifier = this.model.get('_id') + "-OpenTextInput-UserAnswer";
            var userAnswer = '';
            if (this.supports_html5_storage()) {
                userAnswer = localStorage.getItem(identifier);
            } else {
                console.warn("No local storage available");
            }
            return userAnswer;
        },
        onComplete: function(parameters) {
            this.model.set({
                _isComplete: true,
                _isEnabled: false,
            });
            this.$(".component-widget").addClass("disabled");
            // this.showMarking();
            this.showUserAnswer();
            Adapt.trigger('questionView:complete', this);
        },
        showFeedback: function() {

            this.model.set('feedbackAudio', this.model.get("feedback").audio);

            Adapt.mediator.defaultCallback('questionView:feedback', function(feedback) {
                Adapt.trigger('questionView:showFeedback', feedback);
            });

            Adapt.trigger('questionView:feedback', {
                title: this.model.get('title'),
                message: this.model.get('submittedMessage'),
                audio: this.model.get('feedbackAudio')
            });

        },
        markQuestion: function() {}
    });

    Adapt.register("opentextinput", OpenTextInput);

});
