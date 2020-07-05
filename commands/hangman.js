var Sentencer = require('sentencer');

const stages = new Array();
stages.push(``);
stages.push(`-------`);

stages.push(`
 |
 |
 |
 |
 |
-------`);

stages.push(`
----|
 |
 |
 |
 |
 |
-------`);

stages.push(`
----|
 |  💀
 |
 |
 |
 |
-------`);

stages.push(`
----|
 |  💀
 |	 |
 |	 |
 |
 |
-------`);

stages.push(`
----|
 |  💀
 | --|
 |	 |
 |
 |
-------`);

stages.push(`
  ----|
   |  💀
   | --|--
   |   |
   |
   |
  -------`);

stages.push(`
----|
 |  💀
 | --|--
 |	 |
 |  /
 |
-------`);

stages.push(`
----|
 |  💀
 | --|--
 |	 |
 |  / \\
 |
-------`);

function getPositionsOfLetter(guess, word){ // returns an array containing the index's of all matching characters
	let positions = new Array();
	for (i = 0; i < word.length; i++) {
		if (word[i] == guess) {
			positions.push(i);
		}
	}
	return positions;
}

function newWord() {  // make sure to use .toLowerCase()
  let newWord = Sentencer.make("{{ noun }}");
  console.log("Hangman word generated: " +newWord);
	return newWord;
}

function resetGame() {  // reset all the variables
	return new Promise(function(resolve, reject) {
		currentWord = newWord();
		correctLetters = new Array(currentWord.length);
    guessedLetters = new Array();
		strikes = 0;
		resolve();
	});
}

function sendNewGameMessage(channel){
  channel.send("New Game Started!\n "+ generateUnderscores(currentWord, new Array()));
}

function generateUnderscores(word, correctLetters) {
	let response = "";
	for (letter of word){
		if (correctLetters.includes(letter)){
			response += letter+" ";
		}
		else{
			response += "❓ ";
		}
	}
	return response;
}

var currentWord = newWord();
var correctLetters = new Array(currentWord.length);
var guessedLetters = new Array();
var strikes = 0;


function winGame(channel){
  let oldWord = currentWord;
  resetGame().then(() => {
    channel.send("You Win! The word was " + oldWord)
    .then( () => {
      sendNewGameMessage(channel);
    })
  });
}

module.exports = {
	name: 'hangman',
	description: 'Play a game of hangman',
	usage: 'hangman o',
  cooldown: 1,
	execute(message, args) {  // NEEDS ERROR CATCHING IMPLIMENTED

    if (args.length === 0){

      return message.channel.send(stages[strikes] + "\n" + generateUnderscores(currentWord, correctLetters));
    }

		let guess = args[0].toLowerCase();

    if (!(/^[a-zA-Z]+$/.test(guess))){
      return message.reply("Please only use letters for your guesses!");
    }

		let positions = getPositionsOfLetter(guess, currentWord);
		if (guessedLetters.includes(guess)) return message.reply(guess + " has already been guesssed");

    if (guess.length === 1) guessedLetters.push(guess);
		let response = "";


    if (guess.length > 1 && guess === currentWord) {
      winGame(message.channel);
      return;
    }
		else if (positions.length > 0) {  // the guess was successful
			response += "Correct! ";
			for (position of positions) {
				correctLetters[position] = currentWord[position];
			}
			if (!correctLetters.includes(undefined)) { // there are no unknown letters
				winGame(message.channel);
				return;

			}
		}
		else {  // the guess was incorrect
      strikes++;
      response += "Wrong! ";

			if (strikes >= stages.length - 1) {  // after 10 incorrect guesses GAME OVER
				let oldWord = currentWord;
				resetGame().then( () => {  // await completion of the new word generation
					return message.channel.send(stages[stages.length-1] + "\nYou lose! The word was " + oldWord)
          .then( () => {
            sendNewGameMessage(message.channel);
          });
				});
				return;
			}
		}
		response += stages[strikes] + "\n" + generateUnderscores(currentWord, correctLetters);

    message.channel.send(response);

	}
};
