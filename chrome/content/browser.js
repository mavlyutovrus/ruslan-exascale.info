


function jsdump(str) {
  console.error("[ENCRYPTED]: " + str);
}


(function(){

const Cc = Components.classes;
const Ci = Components.interfaces;
const Aes = {Ctr:{}}
const Utf8 = {}
const eComm = {

	pkg:'Encrypted Communication 1.5.3',
	msgHdr: ""
		+ "--- This message has been encrypted using eComm Mozilla Firefox Extension\n"
		+ "--- You need to have this extension installed in your browser to decrypt it\n"
		+ "--- https://addons.mozilla.org/addon/encrypted-communication/\n\n",
	
	handleEvent: function(ev) {
		
		switch(ev.type) {
						
			case 'load':

				window.removeEventListener(ev.type, this, false);
				window.setTimeout(function(){
					try {
						let popup = document.getElementById("contentAreaContextMenu");
						popup.appendChild(this.createElement('menuitem','Encrypt'));
						popup.appendChild(this.createElement('menuitem','Decrypt'));
						popup.addEventListener('popupshowing',this,false);
					} catch(ex) {
						this.prompt(ex);
					}
				}.bind(this),911);
				if("@mozilla.org/parserutils;1" in Cc) {
					let u = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);
					this.nohtml = function(s) u.convertToPlainText(''+s,0,0).trim();
				}
				break;
			case 'popupshowing':
				if(gContextMenu && gContextMenu.target) {
					gContextMenu.showItem('ecomm-encrypt', gContextMenu.onTextInput );
					gContextMenu.showItem('ecomm-decrypt',!!this.encryptedContent(gContextMenu.target));
				}
			default:break;
		}
		ev = undefined;
	},
	
	encryptedContent: function(o,i) {
		//jsdump("cool!!!!!!");
		let result = !1, T = function(t) t.replace(/(?:<\/?p>|\s|https:\/\/.*?d-c)+/gi,' ').trim();
		try {
			var c = (o.nodeName == 'TEXTAREA' ? o.value : o.innerHTML).replace(/(?:\<br\s*\/?\s*\>\n?|\<\/?p\>)/gi,"\n").replace(/\<[^>]+\>|&nbsp;/g,"");
			result = (function(c,m) ~c.indexOf(T(m)) && ~c.indexOf('--- E') ? {c:c,o:o} : null)(T(c),this.msgHdr);
			if(!result && !i && o.nodeName != 'TEXTAREA') result = this.encryptedContent(o.parentNode,!0);
		}catch(e) {}
		
		return result;
	},
	
	nohtml: function(m) {
		return m && (''+m).replace(/<\/?\w[^>]*>/g,'') || '';
	},
	
	handleCommand: function(e) {
		var p,c,o = gContextMenu.target;
		if(!o)return;
		console.log(o);

		window.alert(translate2russian("i love it!"));

		
		let s = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
			pwd1 = {value: ""},
			pwd2 = {value: ""},
			chck = {value:true};
		
		if(!s.promptPassword(null,this.pkg, "Enter Password:", pwd1, null, chck)) return;
		
		if(e.id === 'ecomm-encrypt') {
			if(!s.promptPassword(null,this.pkg,"Verify Password:", pwd2, null, chck)) return;
			
			if(pwd1.value !== pwd2.value) {
				this.prompt('These passwords does not match.');
				return;
			}
		}
		p = pwd1.value;
		
		switch(e.id) {
			case 'ecomm-encrypt':
				var j = "\n", h = this.msgHdr, m = 0;
				
				if(o.nodeName == 'TEXTAREA') {
					c = o.value;
				} else if(['HTML','BODY'].indexOf(o.nodeName) != -1 && o.ownerDocument.designMode == 'on') {
					c = o.ownerDocument.body.innerHTML;
					j = "<br/>"+j;
					h = h.replace("\n",j,"g");
				} else if(o.hasAttribute('contenteditable') && o.getAttribute('contenteditable') === 'true') {
					c = o.innerHTML;
					j = "<br/>"+j;
					h = h.replace("\n",j,"g");
					m = 1;
				} else {
					this.prompt('This is not a suitable object ('+o.nodeName+')');
					break;
				}
				
				try {
					c = j + h + Aes.Ctr.encrypt(c,p).match(/.{1,75}/g).join(j) + j+j+"--- End of Encrypted Message\n";
				}catch(e){
					this.prompt("Internal error encrypting message. Please report this issue to the author with the following info:\n\n"+e);
					return;
				}
				
				if(o.nodeName == 'TEXTAREA') {
					o.value = o.textContent = c;
				} else if(m) {
					o.innerHTML = c;
				} else {
					o.ownerDocument.body.innerHTML = c;
				}
				this.iterator();
				break;
			
			case 'ecomm-decrypt':
				
				if(!(c = this.encryptedContent(o))) {
					this.prompt('This is not a suitable content.');
					break;
				}
				o = c.o;
				c = c.c;
				
				try {
					c = Aes.Ctr.decrypt(c.match(/on\/\s*([\S\s]+?)\s*--- End of Encrypted Message/)[1].replace(/\s+/g,''),p);
				}catch(e) {
					this.prompt('Invalid or truncated encrypted message.\n\n'+e.message);
					return;
				}
				
				try {
					c = this.nohtml(c.replace(/(?:<br\s*\/?\s*>)?\r?\n/gi,"<br/>"));
					
					if(o.nodeName == 'TEXTAREA') {
						// o.value = o.textContent = c.replace(/\<br\s*\/?\s*\>\n?/gi,"\n").replace(/\<\/?\w[^>]+\>|&nbsp;/g,"");
						o.value = o.textContent = c;
					} else {
						// [YG]mail requires \n -> <br>\n - hopefully no side effects on other sites!
						if(o.nodeName !== 'PRE')
							c = c.replace(/\n/g,"<br/>\n");
						
						o.innerHTML = c;
					}
				}catch(e){this.prompt(e);}
				
			default:break;
		}
	},
	
	prompt: function(m) {
		Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService).alert(null,this.pkg,m);
	},
	
	iterator: function() {
		let c, p = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		try {
			c = p.getIntPref('extensions.encryptedcommunication.iterator');
		} catch(e) {
			c = 0;
		}
		if(++c == 40 || c >= 200) {
			gBrowser.selectedTab = gBrowser.addTab('http://goo.gl/Q6ZiF');
			this.prompt("We're proud you are making such good use of our Encrypted Communication add-on and therefore we'll really apreciate if you show us your support with a small contribution. Thank you.");
			c = 0;
		}
		p.setIntPref('extensions.encryptedcommunication.iterator',c);
	},
	
	createElement: function(e,a) {
		const XUL_NS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
		if(e == 'menuitem') {
			a = {
				label:a + ' Communication',
				id: 'ecomm-' + a.toLowerCase(),
				oncommand: 'window.diegocr.eComm.handleCommand(this)',
				"class": 'menuitem-iconic',
				image: 'chrome://ecomm/skin/logo16.png',
			};
		}
		
		e = document.createElementNS(XUL_NS,e);
		if(!e)return null;
		
		if( a ) for( var x in a) {
			e.setAttribute(x,a[x]);
		}
		return e;
	}
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  AES implementation in JavaScript (c) Chris Veness 2005-2011                                   */
/*   - see http://csrc.nist.gov/publications/PubsFIPS.html#197                                    */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * AES Cipher function: encrypt 'input' state with Rijndael algorithm
 *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
 *
 * @param {Number[]} input 16-byte (128-bit) input state array
 * @param {Number[][]} w   Key schedule as 2D byte-array (Nr+1 x Nb bytes)
 * @returns {Number[]}     Encrypted output state array
 */
Aes.cipher = function (input, w)
{ // main Cipher function [�5.1]
	var Nb = 4; // block size (in words): no of columns in state (fixed at 4 for AES)
	var Nr = w.length / Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys
	
	var state = [[], [], [], []]; // initialise 4xNb byte-array 'state' with input [�3.4]
	for (var i = 0; i < 4 * Nb; i++)
		state[i % 4][Math.floor(i / 4)] = input[i];
	
	state = Aes.addRoundKey(state, w, 0, Nb);
	
	for (var round = 1; round < Nr; round++)
	{
		state = Aes.subBytes(state, Nb);
		state = Aes.shiftRows(state, Nb);
		state = Aes.mixColumns(state, Nb);
		state = Aes.addRoundKey(state, w, round, Nb);
	}
	
	state = Aes.subBytes(state, Nb);
	state = Aes.shiftRows(state, Nb);
	state = Aes.addRoundKey(state, w, Nr, Nb);
	
	var output = new Array(4 * Nb); // convert state to 1-d array before returning [�3.4]
	for (var i = 0; i < 4 * Nb; i++)
		output[i] = state[i % 4][Math.floor(i / 4)];
	return output;
}

/**
 * Perform Key Expansion to generate a Key Schedule
 *
 * @param {Number[]} key Key as 16/24/32-byte array
 * @returns {Number[][]} Expanded key schedule as 2D byte-array (Nr+1 x Nb bytes)
 */
Aes.keyExpansion = function (key)
{ // generate Key Schedule (byte-array Nr+1 x Nb) from Key [�5.2]
	var Nb = 4; // block size (in words): no of columns in state (fixed at 4 for AES)
	var Nk = key.length / 4// key length (in words): 4/6/8 for 128/192/256-bit keys
		var Nr = Nk + 6; // no of rounds: 10/12/14 for 128/192/256-bit keys
	
	var w = new Array(Nb * (Nr + 1));
	var temp = new Array(4);
	
	for (var i = 0; i < Nk; i++)
	{
		var r = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
		w[i] = r;
	}
	
	for (var i = Nk; i < (Nb * (Nr + 1)); i++)
	{
		w[i] = new Array(4);
		for (var t = 0; t < 4; t++)
			temp[t] = w[i - 1][t];
		if (i % Nk == 0)
		{
			temp = Aes.subWord(Aes.rotWord(temp));
			for (var t = 0; t < 4; t++)
				temp[t] ^= Aes.rCon[i / Nk][t];
		}
		else if (Nk > 6 && i % Nk == 4)
		{
			temp = Aes.subWord(temp);
		}
		for (var t = 0; t < 4; t++)
			w[i][t] = w[i - Nk][t]^temp[t];
	}
	
	return w;
}

/*
 * ---- remaining routines are private, not called externally ----
 */

Aes.subBytes = function (s, Nb)
{ // apply SBox to state S [�5.1.1]
	for (var r = 0; r < 4; r++)
	{
		for (var c = 0; c < Nb; c++)
			s[r][c] = Aes.sBox[s[r][c]];
	}
	return s;
}

Aes.shiftRows = function (s, Nb)
{ // shift row r of state S left by r bytes [�5.1.2]
	var t = new Array(4);
	for (var r = 1; r < 4; r++)
	{
		for (var c = 0; c < 4; c++)
			t[c] = s[r][(c + r) % Nb]; // shift into temp copy
		for (var c = 0; c < 4; c++)
			s[r][c] = t[c]; // and copy back
	} // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
	return s; // see asmaes.sourceforge.net/rijndael/rijndaelImplementation.pdf
}

Aes.mixColumns = function (s, Nb)
{ // combine bytes of each col of state S [�5.1.3]
	for (var c = 0; c < 4; c++)
	{
		var a = new Array(4); // 'a' is a copy of the current column from 's'
		var b = new Array(4); // 'b' is a�{02} in GF(2^8)
		for (var i = 0; i < 4; i++)
		{
			a[i] = s[i][c];
			b[i] = s[i][c] & 0x80 ? s[i][c] << 1^0x011b : s[i][c] << 1;
		}
		// a[n] ^ b[n] is a�{03} in GF(2^8)
		s[0][c] = b[0]^a[1]^b[1]^a[2]^a[3]; // 2*a0 + 3*a1 + a2 + a3
		s[1][c] = a[0]^b[1]^a[2]^b[2]^a[3]; // a0 * 2*a1 + 3*a2 + a3
		s[2][c] = a[0]^a[1]^b[2]^a[3]^b[3]; // a0 + a1 + 2*a2 + 3*a3
		s[3][c] = a[0]^b[0]^a[1]^a[2]^b[3]; // 3*a0 + a1 + a2 + 2*a3
	}
	return s;
}

Aes.addRoundKey = function (state, w, rnd, Nb)
{ // xor Round Key into state S [�5.1.4]
	for (var r = 0; r < 4; r++)
	{
		for (var c = 0; c < Nb; c++)
			state[r][c] ^= w[rnd * 4 + c][r];
	}
	return state;
}

Aes.subWord = function (w)
{ // apply SBox to 4-byte word w
	for (var i = 0; i < 4; i++)
		w[i] = Aes.sBox[w[i]];
	return w;
}

Aes.rotWord = function (w)
{ // rotate 4-byte word w left by one byte
	var tmp = w[0];
	for (var i = 0; i < 3; i++)
		w[i] = w[i + 1];
	w[3] = tmp;
	return w;
}

// sBox is pre-computed multiplicative inverse in GF(2^8) used in subBytes and keyExpansion [�5.1.1]
Aes.sBox = [
	0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
	0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
	0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
	0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
	0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
	0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
	0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
	0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
	0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
	0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
	0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
	0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
	0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
	0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
	0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
	0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16];

// rCon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [�5.2]
Aes.rCon = [
	[0x00, 0x00, 0x00, 0x00],
	[0x01, 0x00, 0x00, 0x00],
	[0x02, 0x00, 0x00, 0x00],
	[0x04, 0x00, 0x00, 0x00],
	[0x08, 0x00, 0x00, 0x00],
	[0x10, 0x00, 0x00, 0x00],
	[0x20, 0x00, 0x00, 0x00],
	[0x40, 0x00, 0x00, 0x00],
	[0x80, 0x00, 0x00, 0x00],
	[0x1b, 0x00, 0x00, 0x00],
	[0x36, 0x00, 0x00, 0x00]];

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  AES Counter-mode implementation in JavaScript (c) Chris Veness 2005-2011                      */
/*   - see http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf                       */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Encrypt a text using AES encryption in Counter mode of operation
 *
 * Unicode multi-byte character safe
 *
 * @param {String} plaintext Source text to be encrypted
 * @param {String} password  The password to use to generate a key
 * @param {Number} nBits     Number of bits to be used in the key (128, 192, or 256)
 * @returns {string}         Encrypted text
 */
Aes.Ctr.encrypt = function (plaintext, password)
{
	var blockSize = 16; // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
	var nBits = 256; // standard allows 128/192/256 bit keys
	plaintext = Utf8.encode(plaintext);
	password = Utf8.encode(password);
	
	// use AES itself to encrypt password to get cipher key (using plain password as source for key
	// expansion) - gives us well encrypted key (though hashed key might be preferred for prod'n use)
	var nBytes = nBits / 8; // no bytes in key (16/24/32)
	var pwBytes = new Array(nBytes);
	for (var i = 0; i < nBytes; i++)
	{ // use 1st 16/24/32 chars of password for key
		pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
	}
	var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes)); // gives us 16-byte key
	key = key.concat(key.slice(0, nBytes - 16)); // expand key to 16/24/32 bytes long
	
	// initialise 1st 8 bytes of counter block with nonce (NIST SP800-38A �B.2): [0-1] = millisec,
	// [2-3] = random, [4-7] = seconds, together giving full sub-millisec uniqueness up to Feb 2106
	var counterBlock = new Array(blockSize);
	
	var nonce = (new Date()).getTime(); // timestamp: milliseconds since 1-Jan-1970
	var nonceMs = nonce % 1000;
	var nonceSec = Math.floor(nonce / 1000);
	var nonceRnd = Math.floor(Math.random() * 0xffff);
	
	for (var i = 0; i < 2; i++)
		counterBlock[i] = (nonceMs >>> i * 8) & 0xff;
	for (var i = 0; i < 2; i++)
		counterBlock[i + 2] = (nonceRnd >>> i * 8) & 0xff;
	for (var i = 0; i < 4; i++)
		counterBlock[i + 4] = (nonceSec >>> i * 8) & 0xff;
	
	// and convert it to a string to go on the front of the ciphertext
	var ctrTxt = '';
	for (var i = 0; i < 8; i++)
		ctrTxt += String.fromCharCode(counterBlock[i]);
	
	// generate key schedule - an expansion of the key into distinct Key Rounds for each round
	var keySchedule = Aes.keyExpansion(key);
	
	var blockCount = Math.ceil(plaintext.length / blockSize);
	var ciphertxt = new Array(blockCount); // ciphertext as array of strings
	
	for (var b = 0; b < blockCount; b++)
	{
		// set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
		// done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
		for (var c = 0; c < 4; c++)
			counterBlock[15 - c] = (b >>> c * 8) & 0xff;
		for (var c = 0; c < 4; c++)
			counterBlock[15 - c - 4] = (b / 0x100000000 >>> c * 8)
			
			var cipherCntr = Aes.cipher(counterBlock, keySchedule); // -- encrypt counter block --
		
		// block size is reduced on final block
		var blockLength = b < blockCount - 1 ? blockSize : (plaintext.length - 1) % blockSize + 1;
		var cipherChar = new Array(blockLength);
		
		for (var i = 0; i < blockLength; i++)
		{ // -- xor plaintext with ciphered counter char-by-char --
			cipherChar[i] = cipherCntr[i]^plaintext.charCodeAt(b * blockSize + i);
			cipherChar[i] = String.fromCharCode(cipherChar[i]);
		}
		ciphertxt[b] = cipherChar.join('');
	}
	
	return btoa(ctrTxt + ciphertxt.join('')); // encode in base64
}

/**
 * Decrypt a text encrypted by AES in counter mode of operation
 *
 * @param {String} ciphertext Source text to be decrypted
 * @param {String} password   The password to use to generate a key
 * @param {Number} nBits      Number of bits to be used in the key (128, 192, or 256)
 * @returns {String}          Decrypted text
 */
Aes.Ctr.decrypt = function (ciphertext, password)
{
	var blockSize = 16; // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
	var nBits = 256; // standard allows 128/192/256 bit keys
	ciphertext = atob(ciphertext);
	password = Utf8.encode(password);
	
	// use AES to encrypt password (mirroring encrypt routine)
	var nBytes = nBits / 8; // no bytes in key
	var pwBytes = new Array(nBytes);
	for (var i = 0; i < nBytes; i++)
	{
		pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
	}
	var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));
	key = key.concat(key.slice(0, nBytes - 16)); // expand key to 16/24/32 bytes long
	
	// recover nonce from 1st 8 bytes of ciphertext
	var counterBlock = new Array(8),
		ctrTxt = ciphertext.slice(0, 8);
	for (var i = 0; i < 8; i++)
		counterBlock[i] = ctrTxt.charCodeAt(i);
	
	// generate key schedule
	var keySchedule = Aes.keyExpansion(key);
	
	// separate ciphertext into blocks (skipping past initial 8 bytes)
	var nBlocks = Math.ceil((ciphertext.length - 8) / blockSize);
	var ct = new Array(nBlocks);
	for (var b = 0; b < nBlocks; b++)
		ct[b] = ciphertext.slice(8 + b * blockSize, 8 + b * blockSize + blockSize);
	ciphertext = ct; // ciphertext is now array of block-length strings
	
	// plaintext will get generated block-by-block into array of block-length strings
	var plaintxt = new Array(ciphertext.length);
	
	for (var b = 0; b < nBlocks; b++)
	{
		// set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
		for (var c = 0; c < 4; c++)
			counterBlock[15 - c] = ((b) >>> c * 8) & 0xff;
		for (var c = 0; c < 4; c++)
			counterBlock[15 - c - 4] = (((b + 1) / 0x100000000 - 1) >>> c * 8) & 0xff;
		
		var cipherCntr = Aes.cipher(counterBlock, keySchedule); // encrypt counter block
		
		var plaintxtByte = new Array(ciphertext[b].length);
		for (var i = 0; i < ciphertext[b].length; i++)
		{
			// -- xor plaintxt with ciphered counter byte-by-byte --
			plaintxtByte[i] = cipherCntr[i]^ciphertext[b].charCodeAt(i);
			plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
		}
		plaintxt[b] = plaintxtByte.join('');
	}
	
	return Utf8.decode(plaintxt.join('')); // decode from UTF8 back to Unicode multi-byte chars
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple          */
/*              single-byte character encoding (c) Chris Veness 2002-2011                         */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
 * (BMP / basic multilingual plane only)
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
 *
 * @param {String} strUni Unicode string to be encoded as UTF-8
 * @returns {String} encoded string
 */
Utf8.encode = function (strUni)
{
	// use regular expressions & String.replace callback function for better efficiency
	// than procedural approaches
	var strUtf = strUni.replace(
			/[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
			function (c)
			{
				var cc = c.charCodeAt(0);
				return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
			}
		);
	strUtf = strUtf.replace(
			/[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
			function (c)
			{
				var cc = c.charCodeAt(0);
				return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
			}
		);
	return strUtf;
}

/**
 * Decode utf-8 encoded string back into multi-byte Unicode characters
 *
 * @param {String} strUtf UTF-8 string to be decoded back to Unicode
 * @returns {String} decoded string
 */
Utf8.decode = function (strUtf)
{
	// note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
	var strUni = strUtf.replace(
			/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
			function (c)
			{ // (note parentheses for precence)
				var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
				return String.fromCharCode(cc);
			}
		);
	strUni = strUni.replace(
			/[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
			function (c)
			{ // (note parentheses for precence)
				var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
				return String.fromCharCode(cc);
			}
		);
	return strUni;
}

//window.alrert("start point");

if(!("diegocr" in window)) {
	window.diegocr = {};
}
window.diegocr.eComm = eComm;
window.addEventListener('load', eComm, false);


} // closing bracet


)();




var observe = false;
var chatWindowOpened = false;
var intervalVariable = 0
var docInFocus = 0

var privateKey = "-----BEGIN RSA PRIVATE KEY-----\
MIICXQIBAAKBgQDwTj46oh321rs8bo+E7mtk8syKu5gIRwLDQtNChPbdxKtkxu29\
kh6in/jjMRicmfQWuJmd5UIvnzTtQNuk6iM/Oq6/Ht1/hY91px8lhxObbQH/esp4\
G0+SbHt4MXDnbvUqQn0sUULTsE91i42H2cn4zKxSI7zxdlN5BRvb6tzVQQIDAQAB\
AoGAFy1kwSD7xOAHJRgAzbB1OUJVyhe33SyELrMWTzcl3FPouAqbyYn7XHITfk4w\
8oHC0iIx5tHC5Xb0kuGLjcdraLD2EF5Eg6mj3Xqr7A4+LfvEUkHGtkalGttZJK/i\
WtOiQpZDCcLR/Ab87CAkaSxE21NJEOQnDyyUAWwCmafaUBUCQQD69bs+G47bbeCL\
VEuhWCiGrfPEWL4VNLopgzxDGaPVzvTV9sey2poGt24Q9Txz3x3ywCD2v8S93Vnw\
wdasKS37AkEA9SG8DuRJbyRU5PrQaeoYdy8mPHWxi38FcO/jwva5VPv/sywJay9e\
mXoYXV9rfK1aGKQitVqs/5zMf+DG+muQ8wJAYhJjoOrOEgxHYsuHXr7/31ndWE7B\
wbHASnbBtwsvDl/5KCBvfAKXjKZkOfZMMI/xuSrB9wuMDBKTklV92fuhvwJBAItK\
eAoePnwhMPxMaVFF7FENQbTpS9Hwg68BIXMPr5BTAaFWTKPTbvXXIzErn3BhMOj/\
m5lhxRwahTnFCEwUA3ECQQCqcPnzB/0RyM0DfbN4MO2xD6lk5J1LgZROuqnzvEf5\
+FMGjoBlPj8qoPbr1jWHe5hOcNKywp4SSlxnvus6tKJH\
-----END RSA PRIVATE KEY-----";

var publicKey = "-----BEGIN PUBLIC KEY-----\
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDwTj46oh321rs8bo+E7mtk8syK\
u5gIRwLDQtNChPbdxKtkxu29kh6in/jjMRicmfQWuJmd5UIvnzTtQNuk6iM/Oq6/\
Ht1/hY91px8lhxObbQH/esp4G0+SbHt4MXDnbvUqQn0sUULTsE91i42H2cn4zKxS\
I7zxdlN5BRvb6tzVQQIDAQAB\
-----END PUBLIC KEY-----";

var keysRecieved = {};
var keysSentTo = {};
var id2reciever = {}
var id2recieverSize = 0;
var keyDownEvent = 0;

var sourceLang = "en";

function translate2russian(message) {
    let url = "https://translate.yandex.net/api/v1.5/tr/translate?key=trnsl.1.1.20140511T021910Z.7eeea2bccc918d37.f0e14bb673e90486abe8786d766f5b479cbff695&lang=" + sourceLang + "-en&text=" + message;
    var req = new XMLHttpRequest();
    req.open('GET', url, false); 
    req.send(null);
    if (req.status == 200) {
	  return req.responseText.split("<text>")[1].split("</text>")[0];
    }
    return message;
}


function translate2source(message) {
    let url = "https://translate.yandex.net/api/v1.5/tr/translate?key=trnsl.1.1.20140511T021910Z.7eeea2bccc918d37.f0e14bb673e90486abe8786d766f5b479cbff695&lang=en-" + sourceLang + "&text=" + message;
    var req = new XMLHttpRequest();
    req.open('GET', url, false); 
    req.send(null);
    if (req.status == 200) {
	  //window.alert("orig:" + message + "; results: " + req.responseText);
	  return req.responseText.split("<text>")[1].split("</text>")[0];
    }
    return message;
}

function sendKey(textArea) {
    return  "[key:]" + publicKey;
}

function encryptMessage(message, targetTextArea, recieverId) {
    if (message) {
	message = translate2russian(message);
    }
    if (!keysRecieved[recieverId]) {
	console.log("NO keys!!!!");
	if (!keysSentTo[recieverId]) {
            keysSentTo[recieverId] = 1;
	    return sendKey(targetTextArea);
	}
    } else {
	if (message) {
            var encryptor = new JSEncrypt();
            encryptor.setPublicKey(publicKey);
            message = "[encrypted]:" + encryptor.encrypt(message);
	}
    }
    //window.alert(message);
    return message;
}


function informUser(keyBubble, recieverId) {
    if (keysSentTo[recieverId] && keysRecieved[recieverId]) {
	//show secured connection
    }
}


var seen = {}

function decryptMessage(message, textContainer, recieverId) {
    if (!message) {
	return message;
    }
    if (seen[message]) {
        return message;
    }
    if (message.indexOf("[encrypted]:") == 0) {
        message = message.replace("[encrypted]:", "");
        var decrypt = new JSEncrypt();
        decrypt.setPrivateKey(privateKey);
        try {
            message = decrypt.decrypt(message);
        } catch (e) {
            seen[message] = 1;
            return message;
        }
    }
    if (message.indexOf("[key") == 0) {
	var our = textContainer.parentNode.parentNode.className == "_kso fsm direction_ltr _55r0";
	if (our) {
            keysSentTo[recieverId] = 1;
	    //if (recieverId == "https://www.facebook.com/i.love.ruslan") {
            //    keysRecieved[recieverId] = 1;
	    //}
            informUser(textContainer, recieverId);
	    message = "key sent...";
	} else {
            keysRecieved[recieverId] = 1;
            informUser(textContainer, recieverId);
	    message = "key received...";
	}
    }
    message = translate2source(message);
    seen[message] = 1;
    return message;
}

function walkTheDOM(node, func) {
    func(node);
    node = node.firstChild;
    while (node) {
	walkTheDOM(node, func);
	node = node.nextSibling;
    }
}

function checkChatWindow() {
	if (!docInFocus  && intervalVariable) {
		window.clearInterval(intervalVariable);
	}

        var chatBoxes = docInFocus.getElementsByClassName("fbDockChatTabFlyout");
	for (var boxIndex in chatBoxes) {
	    var chatBox = chatBoxes[boxIndex];
	    if (!chatBox.tagName) {
		continue;
	    }
	    if (!chatBox.id) {
	        chatBox.id = "chatBox" + String(id2recieverSize);
		var textAreaId = "txtArea" + String(id2recieverSize);
		id2recieverSize += 1;
		var titles = chatBox.getElementsByClassName("titlebarText");
		id2reciever[textAreaId] = titles[0].href;
	        var textAreas = chatBox.getElementsByClassName("uiTextareaAutogrow");
		var textArea = textAreas[0];
		textArea.id = textAreaId;
	        textArea.onkeydown = function(event) { if (event.key == "Enter") {
							  if (event.shiftKey) {
		                                              event.target.value = encryptMessage(event.target.value, event.target, id2reciever[event.target.id]); 
							  } else {
							      if (event.target.value) {
							          window.alert(translate2russian(event.target.value));
								  event.target.value = translate2russian(event.target.value);
							      }
							  }
		                                       }
		                                     };
	    }
	}

	// decrypt messages
	for (chatId in id2reciever) {
	    var textArea = docInFocus.getElementById(chatId);
	    if (!textArea) {
		continue;
	    }
	    var recieverId = id2reciever[chatId];
	    var messageBubbles = textArea.parentNode.parentNode.parentNode.getElementsByClassName("messages");
	    for (var msgIndex = 0; msgIndex < messageBubbles.length; ++msgIndex) {
		var bubble = messageBubbles[msgIndex];
	        walkTheDOM(bubble, 
			  function(node) {
                              if ((node.tagName == "SPAN" || 
				       node.tagName == "span") &&
				            node.className.indexOf("null") > -1) {
	                          node.innerHTML = decryptMessage(node.innerHTML,  node, recieverId); 
                              }
			  });
	    }
	}
}

function pageLoad(event) {
	  document = 0;
	  if (intervalVariable) {
		  window.clearInterval(intervalVariable);
	  }	  
	  let doc = event.originalTarget;
	  {
		  if (doc instanceof HTMLDocument) {
		    // is this an inner frame?
		    if (doc.defaultView.frameElement) {
		      // Frame within a tab was loaded.
		      // Find the root document:
		      while (doc.defaultView.frameElement) {
		        doc = doc.defaultView.frameElement.ownerDocument;
		      }
		    }
		  }
	  }
	  
	  let uri = doc.URL;
	  //jsdump(uri);
	  if (uri.indexOf("facebook.com") == -1) {
		  //jsdump(uri + ": stop observing");
		  observe = false;
		  return;
	  }
	  observer = true;
	  docInFocus = doc;
	  
	  //jsdump(uri + ": start observing");
	  intervalVariable = window.setInterval(checkChatWindow, 1000);
	  
	  //console.log(content.document);
	  //console.log(doc.getElementById("blueBar"));
}

gBrowser.addEventListener("load", pageLoad, true);



