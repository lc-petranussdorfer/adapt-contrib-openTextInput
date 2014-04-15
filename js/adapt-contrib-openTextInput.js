/*
 * adapt-contrib-openTextInput
 * License - http://github.com/adaptlearning/adapt_framework/LICENSE
 * Maintainers - Kev Adsett <kev.adsett@gmail.com>, Daryl Hedley <darylhedley@hotmail.com>
 */

define(function(require) {
	var QuestionView = require('coreViews/questionView');
	var Adapt = require('coreJS/adapt');

	var OpenTextInput = QuestionView.extend({
		events: {
			"click .opentextinput-widget .button.save": "onSaveClicked",
			"click .opentextinput-widget .button.submit": "onSubmitClicked",
			"click .opentextinput-widget .button.reset": "onResetClicked",
			"click .opentextinput-widget .button.model": "onModelAnswerClicked",
			"click .opentextinput-widget .button.user": "onUserAnswerClicked",
			"blur input": "forceFixedPositionFakeScroll"
		},

		forceFixedPositionFakeScroll: function() {
			if (Modernizr.touch) {
				_.defer(function() {
					window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
				});
			}
		},

		canSubmit: function() {
			var canSubmit = true;
			if ($(".opentextinput-item-textbox").val() == "") {
				canSubmit = false;
			}
			return canSubmit;
		},

		checkAnswerIsCorrect: function(possibleAnswers, userAnswer) {},

		cleanupUserAnswer: function(userAnswer) {
			if (this.model.get('_allowsAnyCase')) {
				userAnswer = userAnswer.toLowerCase();
			}
			if (this.model.get('_allowsPunctuation')) {
				var userAnswerClean = userAnswer.replace(/[\.,-\/#!$£%\^&\*;:{}=\-_`~()]/g, "");
				userAnswer = $.trim(userAnswerClean);
			}
			return userAnswer;
		},

		markQuestion: function() {},

		onEnabledChanged: function() {
			this.$('.opentextinput-item-textbox').prop('disabled', !this.model.get('_isEnabled'));
		},

		onModelAnswerShown: function() {
			_.each(this.model.get('items'), function(item, index) {
				this.$(".opentextinput-item-textbox").eq(index).val(item.answers[0]);
			}, this);
		},

		onUserAnswerShown: function() {
			_.each(this.model.get('items'), function(item, index) {
				this.$(".opentextinput-item-textbox").eq(index).val(item.userAnswer);
			}, this);
		},

		postRender: function() {
			QuestionView.prototype.postRender.apply(this);
			this.setReadyStatus();
		},

		storeUserAnswer: function() {
			_.each(this.model.get('items'), function(item, index) {
				item.userAnswer = this.$('.opentextinput-item-textbox').eq(index).val();
			}, this);
		}

	});

	Adapt.register("opentextinput", OpenTextInput);

});
