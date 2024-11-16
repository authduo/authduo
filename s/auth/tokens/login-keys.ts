
import {hexId} from "@benev/slate"
import {Keypair} from "../keypair.js"
import {LoginProof} from "./login-proof.js"
import {JsonWebToken, VerificationOptions} from "../utils/json-web-token.js"
import {LoginClaimPayload, LoginKeysPayload} from "./types.js"

/**
 * Login keys token -- able to sign login claims for the user
 *  - represents a user's login, signed by the user's passport
 *  - contains an ephemeral login keypair, used for signing claims on behalf of the user
 *  - you may save this token into your app's local storage, to maintain the user's login
 *  - NEVER distribute these login keys anywhere offsite
 *  	- don't even send these login keys to your own services
 *  	- instead, you can distribute the login proof token, available as `loginKeys.proof.token`
 *    - another good idea is to use the login to sign claim tokens via `login.signClaimToken(~)`
 *    - you can put any information into the claim token that you like
 *    - you can send a `claimToken` along with a `proofToken` and your services can verify them with `Claim.verify(~)`
 */
export class LoginKeys {
	constructor(
		public readonly proof: LoginProof,
		public readonly token: string,
		public readonly payload: LoginKeysPayload,
	) {}

	get expiry() { return JsonWebToken.toJsTime(this.payload.exp) }
	get name() { return this.proof.name }
	get thumbprint() { return this.proof.thumbprint }

	isExpired() {
		return Date.now() > this.expiry
	}

	static decode(proof: LoginProof, token: string) {
		const {payload} = JsonWebToken.decode<LoginKeysPayload>(token)
		return new this(proof, token, payload)
	}

	static async verify(proof: LoginProof, loginToken: string, options?: VerificationOptions) {
		const passportPubkey = await proof.getPassportPubkey()
		await passportPubkey.verify(loginToken, options)
		return this.decode(proof, loginToken)
	}

	async signClaimToken<C>({data, expiry}: {
			data: C
			expiry: number
		}) {
		const sub = this.thumbprint
		const exp = JsonWebToken.fromJsTime(expiry)
		const jti = hexId()
		const loginKeypair = await Keypair.fromData(this.payload.data.loginKeypair)
		return await loginKeypair.sign<LoginClaimPayload<C>>({sub, exp, data, jti})
	}
}

