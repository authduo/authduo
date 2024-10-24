
import {Pubkey} from "./pubkey.js"
import {hex} from "../tools/hex.js"
import {KeypairJson} from "./types.js"
import {getCrypto} from "./utils/get-crypto.js"
import {CryptoConstants} from "./crypto-constants.js"
import {JsonWebToken, Payload} from "./utils/json-web-token.js"

export class Keypair extends Pubkey {
	constructor(
			thumbprint: string,
			publicKey: CryptoKey,
			public readonly privateKey: CryptoKey,
		) {
		super(thumbprint, publicKey)
	}

	static async generate() {
		const crypto = await getCrypto()

		const keys = await crypto.subtle
			.generateKey(CryptoConstants.algos.generate, true, ["sign", "verify"])

		const publicBuffer = await crypto.subtle
			.exportKey(CryptoConstants.formats.public, keys.publicKey)

		const thumbprint = hex.from.buffer(
			await crypto.subtle.digest(CryptoConstants.algos.thumbprint, publicBuffer)
		)

		return new this(thumbprint, keys.publicKey, keys.privateKey)
	}

	static async fromJson(json: KeypairJson) {
		const crypto = await getCrypto()

		const pubkey = await Pubkey.fromJson(json)
		const extractable = true
		const privateBuffer = hex.to.buffer(json.privateKey)

		const privateKey = await crypto.subtle.importKey(
			CryptoConstants.formats.private,
			privateBuffer,
			CryptoConstants.algos.generate,
			extractable,
			["sign"],
		)

		return new this(pubkey.thumbprint, pubkey.publicKey, privateKey)
	}

	async toJson(): Promise<KeypairJson> {
		const crypto = await getCrypto()
		const pubkey = await super.toJson()

		const privateBuffer = await crypto.subtle
			.exportKey(CryptoConstants.formats.private, this.privateKey)

		return {
			thumbprint: pubkey.thumbprint,
			publicKey: pubkey.publicKey,
			privateKey: hex.from.buffer(privateBuffer),
		}
	}

	toPubkey() {
		return new Pubkey(this.thumbprint, this.publicKey)
	}

	async sign<P extends Payload>(payload: P) {
		return await JsonWebToken.sign<P>(this.privateKey, payload)
	}
}

