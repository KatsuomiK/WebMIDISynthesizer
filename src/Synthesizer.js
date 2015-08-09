import Debug from "./framesynthesis/Debug";
import Channel from "./Channel";

const CHANNEL_MAX = 16;

export default class Synthesizer {
	constructor(options) {
		this.options = options;
		
		this.channels = [];
		for (let i = 0; i < CHANNEL_MAX; i++) {
			this.channels[i] = new Channel();
		}
		
		this.reset();
	}
	
	reset() {
		Debug.log("Initializing Synthesizer");
		
		for (let i = 0; i < CHANNEL_MAX; i++) {
			this.channels[i].reset();
		}
	}
	
	render(buffer, sampleRate) {
		for (let i = 0; i < buffer.length; i++) {
			buffer[i] = 0;
		}
		
		for (let i = 0; i < CHANNEL_MAX; i++) {
			this.channels[i].render(buffer, sampleRate);
		}
	}
	
	processMIDIMessage(data) {
		if (!data) {
			return;
		}
		
		if (data.length < 3) {
			return;
		}
		
		let statusByte = data[0];
		let statusUpper4bits = statusByte >> 4;
		let channel = statusByte & 0xf;
		let midiChannel = channel + 1;

		if (statusUpper4bits === 0x9) {
			let note = data[1];
			let velocity = data[2];

			this.log(`Ch. ${midiChannel} Note On  note: ${note} velocity: ${velocity}`);
			this.channels[channel].noteOn(note);
		}
		if (statusUpper4bits === 0x8) {
			let note = data[1];
			let velocity = data[2];

			this.log(`Ch. ${midiChannel} Note Off note: ${note} velocity: ${velocity}`);
			this.channels[channel].noteOff(note);
		}
		
		if (statusUpper4bits === 0xe) {
			let lsb = data[1];
			let msb = data[2];
			let bend = ((msb << 7) | lsb) - 8192;

			this.log(`Ch. ${midiChannel} Pitch bend: ${bend}`);
			this.channels[channel].setPitchBend(bend);
		}
		if (statusUpper4bits === 0xb) {
			let controlNumber = data[1];
			let value = data[2];

			if (controlNumber === 1) {
				this.log(`Ch. ${midiChannel} Modulation Wheel: ${value}`);
				this.channels[channel].setModulationWheel(value);
			}
			if (controlNumber === 7) {
				this.log(`Ch. ${midiChannel} Channel Volume: ${value}`);
				this.channels[channel].setVolume(value);
			}
			if (controlNumber === 11) {
				this.log(`Ch. ${midiChannel} Expression Controller: ${value}`);
				this.channels[channel].setExpression(value);
			}
			if (controlNumber === 64) {
				if (value >= 64) {
					this.log(`Ch. ${midiChannel} Damper Pedal On`);
					this.channels[channel].damperPedalOn();
				} else {
					this.log(`Ch. ${midiChannel} Damper Pedal Off`);
					this.channels[channel].damperPedalOff();
				}
			}
			if (controlNumber === 123) {
				if (value === 0) {
					this.log(`Ch. ${midiChannel} All Notes Off`);
					this.channels[channel].allNotesOff();
				}
			}
		}
	}
	
	log(message) {
		if (this.options && this.options.verbose) {
			Debug.log(message);
		}
	}
}

