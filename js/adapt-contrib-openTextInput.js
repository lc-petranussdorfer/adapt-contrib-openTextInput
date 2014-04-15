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
			this.$(".opentextinput-item-textbox").each(function() {
				if ($(this).val() == "") {
					canSubmit = false;
				}
			});
			return canSubmit;
		},

		checkAnswerIsCorrect: function(possibleAnswers, userAnswer) {
			var answerIsCorrect = _.contains(possibleAnswers, this.cleanupUserAnswer(userAnswer));
			if (answerIsCorrect) this.model.set('_hasAtLeastOneCorrectSelection', true);
			return answerIsCorrect;
		},

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

		forEachAnswer: function(callback) {
			_.each(this.model.get('items'), function(item, index) {
				if (this.model.get('_allowsAnyOrder')) {
					this.$(".opentextinput-item-textbox").each($.proxy(function(index, element) {
						var userAnswer = $(element).val();
						callback(this.checkAnswerIsCorrect(item.answers, userAnswer), item);
					}, this));
				} else {
					var userAnswer = this.$(".opentextinput-item-textbox").eq(index).val();
					callback(this.checkAnswerIsCorrect(item.answers, userAnswer), item);
				}
			}, this);
		},

		markQuestion: function() {
			this.forEachAnswer(function(correct, item) {
				item.correct = correct;
			});
			QuestionView.prototype.markQuestion.apply(this);
		},

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
