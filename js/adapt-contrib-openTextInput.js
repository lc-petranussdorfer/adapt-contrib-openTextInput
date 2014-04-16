/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers - LearnChamp Petra Nussdorfer <petra.nussdorfer@learnchamp.com>
 */

define(function(require) {
    var QuestionView = require('coreViews/questionView');
    var Adapt = require('coreJS/adapt');

    var OpenTextInput = QuestionView.extend({
        events: {
            "click .opentextinput-widget .button.save": "onSaveClicked",
            "click .opentextinput-widget .button.submit": "onSubmitClicked",
            "click .opentextinput-widget .button.model":"onModelAnswerClicked",
            "click .opentextinput-widget .button.user":"onUserAnswerClicked"
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
        },
        setupDefaultSettings: function() {            
            this.model.set("_isSaved", false);
            console.log("Initial UserAnswer: "+this.getUserAnswer());
            QuestionView.prototype.setupDefaultSettings.apply(this);
            this.$(".opentextinput-item-textbox").val(this.getUserAnswer());
        },

        // onSubmitClicked: function(event) {
        //     event.preventDefault();
        //     console.log("onSubmitClicked");
        // },
        supports_html5_storage: function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        },
        canSubmit: function() {
            var canSubmit = true;
            if ($(".opentextinput-item-textbox").val() == "") {
                canSubmit = false;
            }
            return canSubmit;
        },
        forceFixedPositionFakeScroll: function() {
            if (Modernizr.touch) {
                _.defer(function() {
                    window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
                });
            }
        },
        storeUserAnswer: function() {
            var userAnswer = this.$(".opentextinput-item-textbox").val();
            var identifier = this.model.get('_id') + "-OpenTextInput-UserAnswer";
            // check localstorage
            if (this.supports_html5_storage()) {
                localStorage.setItem(identifier, userAnswer);
                this.model.set("_isSaved", true);

            } else {
                alert("No local storage available");
            }
        },
        onSaveClicked: function(event) {
            event.preventDefault();

            /*console.log("UserAnswer: " + userAnswer);
            console.log("Model Wert",this.model.get("_isSaved"));*/

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
            // this.showFeedback();
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
                this.model.set("_isSaved", true);

            } else {
                alert("No local storage available");
            }
            return userAnswer;
        },
        postRender: function() {
            QuestionView.prototype.postRender.apply(this);
            this.setReadyStatus();
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
        markQuestion: function() {}
    });

    Adapt.register("opentextinput", OpenTextInput);

});
