export default class MML2SMF {
	convert(mml) {
		const abcdefg = [9, 11, 0, 2, 4, 5, 7];
		
		let trackData = [];
		let tick = 24;
		
		let restTick = 0;
		
		const OCTAVE_MIN = -1;
		const OCTAVE_MAX = 10;
		let octave = 4;
		
		for (let i = 0; i < mml.length; i++) {
			let command = mml.charAt(i);
			
			switch (command) {
				case "c":
				case "d":
				case "e":
				case "f":
				case "g":
				case "a":
				case "b":
					let n = mml.charCodeAt(i) - "a".charCodeAt(0);
					if (n < 0 || n >= abcdefg.length) {
						break;
					}
					let note = (octave + 1) * 12 + abcdefg[n];
					if (mml.charAt(i + 1) === "+") {
						note++;
						i++;
					} else if (mml.charAt(i + 1) === "-") {
						note--;
						i++;
					}
					
					let velocity = 96;

					trackData.push(restTick, 0x90, note, velocity, tick, 0x80, note, 0);
					restTick = 0;
					break;
					
				case "r":
					restTick += tick;
					break;
				
				case "o":
					{
						let n = parseInt(mml.substr(i + 1, 3));
						if (OCTAVE_MIN <= n || n <= OCTAVE_MAX) {
							octave = n;
							i += String(n).length;
							break;
						}
					}
					throw new Error(`pos ${i} : no octave number`);
					return;
				
				case "<":
					if (octave < OCTAVE_MAX) {
						octave++;
					}
					break;
				
				case ">":
					if (octave > OCTAVE_MIN) {
						octave--;
					}
					break;
			}
		}
		
		let trackNum = 1;
		let resolution = 48;
		let smfFormat = 0;
		
		const smfHeader = [
			0x4d, 0x54, 0x68, 0x64,
			0x00, 0x00, 0x00, 0x06,
			0x00, smfFormat, 
			(trackNum >> 8) & 0xff,
			trackNum & 0xff,
			(resolution >> 8) & 0xff,
			resolution & 0xff
		];
		
		const trackHeader = [
			0x4d, 0x54, 0x72, 0x6b,
			(trackData.length >> 24) & 0xff,
			(trackData.length >> 16) & 0xff,
			(trackData.length >> 8) & 0xff,
			trackData.length & 0xff
		];
		
		let smf = smfHeader.concat(trackHeader, trackData);
		
		return new Uint8Array(smf);
	}
}