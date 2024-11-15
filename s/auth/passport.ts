
import {deep, hexId, randomFullName} from "@benev/slate"

import {Keypair} from "./keypair.js"
import {PassportData, KeypairData} from "./types.js"
import {JsonWebToken} from "./utils/json-web-token.js"
import {LoginPayload, LoginSessionTokens, ProofPayload} from "./tokens/types.js"

export class Passport {
	constructor(
		public readonly keypairData: KeypairData,
		public name: string,
		public created: number,
	) {}

	get thumbprint() {
		return this.keypairData.thumbprint
	}

	static async generate() {
		const keypair = await Keypair.generate()
		const keypairData = await keypair.toData()
		const name = randomFullName()
		const created = Date.now()
		return new this(keypairData, name, created)
	}

	static fromData(data: PassportData) {
		const {keypair, name, created} = data
		return new this(keypair, name, created)
	}

	toData(): PassportData {
		return deep.clone({
			keypair: this.keypairData,
			name: this.name,
			created: this.created,
		})
	}

	async getKeypair() {
		return await Keypair.fromData(this.keypairData)
	}

	async signLoginToken(o: {
			expiry: number
			issuer: string
			audience: string
		}): Promise<LoginSessionTokens> {

		const passportKeypair = await this.getKeypair()
		const loginKeypair = await Keypair.generate()
		const exp = JsonWebToken.fromJsTime(o.expiry)
		const name = this.name
		const iss = o.issuer
		const aud = o.audience
		const jti = hexId()

		const proofToken = await passportKeypair.sign<ProofPayload>({
			exp,
			iss,
			aud,
			jti,
			data: {
				loginPubkey: await loginKeypair.toPubkey().toData(),
				passportPubkey: await passportKeypair.toPubkey().toData(),
			},
		})

		const loginToken = await passportKeypair.sign<LoginPayload>({
			sub: this.thumbprint,
			exp,
			jti,
			data: {
				name,
				loginKeypair: await loginKeypair.toData(),
			},
		})

		return {proofToken, loginToken}
	}
}

