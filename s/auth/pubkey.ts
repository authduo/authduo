
import {hex} from "../tools/hex.js"
import {PubkeyData} from "./types.js"
import {CryptoConstants} from "./crypto-constants.js"
import {JsonWebToken, Payload, VerificationOptions, VerifyError} from "./utils/json-web-token.js"

export class Pubkey {
	constructor(
		public readonly thumbprint: string,
		public readonly publicKey: CryptoKey,
	) {}

	static async fromData(data: PubkeyData) {
		const extractable = true
		const publicBuffer = hex.to.buffer(data.publicKey)

		const thumbprint = hex.from.buffer(
			await crypto.subtle.digest(CryptoConstants.algos.thumbprint, publicBuffer)
		)

		if (data.thumbprint !== thumbprint)
			throw new VerifyError("incorrect thumbprint")

		const publicKey = await crypto.subtle.importKey(
			CryptoConstants.formats.public,
			publicBuffer,
			CryptoConstants.algos.generate,
			extractable,
			["verify"],
		)

		return new this(thumbprint, publicKey)
	}

	async toData(): Promise<PubkeyData> {
		const publicBuffer = await crypto.subtle
			.exportKey(CryptoConstants.formats.public, this.publicKey)

		const thumbprint = hex.from.buffer(
			await crypto.subtle.digest(
				CryptoConstants.algos.thumbprint,
				publicBuffer,
			)
		)

		return {
			thumbprint,
			publicKey: hex.from.buffer(publicBuffer),
		}
	}

	async verify<P extends Payload>(
			token: string,
			options: VerificationOptions = {},
		) {
		return await JsonWebToken.verify<P>(this.publicKey, token, options)
	}
}

