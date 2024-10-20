
import {deep} from "@benev/slate"
import {Keypair} from "./keypair.js"
import {JsonWebToken} from "./utils/json-web-token.js"
import {randomFullName} from "../../tools/random-names.js"
import {AccessJwtPayload, IdentityJson, KeypairJson} from "./types.js"

export class Identity {
	constructor(
		public readonly keypairJson: KeypairJson,
		public name: string,
		public created: number,
	) {}

	get thumbprint() {
		return this.keypairJson.thumbprint
	}

	static async generate() {
		const keypair = await Keypair.generate()
		const keypairJson = await keypair.toJson()
		const name = randomFullName()
		const created = Date.now()
		return new this(keypairJson, name, created)
	}

	static fromJson(json: IdentityJson) {
		const {keypair, name, created} = json
		return new this(keypair, name, created)
	}

	toJson(): IdentityJson {
		return deep.clone({
			keypair: this.keypairJson,
			name: this.name,
			created: this.created,
		})
	}

	async getKeypair() {
		return await Keypair.fromJson(this.keypairJson)
	}

	async signAccessToken(o: {expiry: number, audience: string}) {
		const keypair = await this.getKeypair()
		return await keypair.sign<AccessJwtPayload>({
			exp: JsonWebToken.fromJsTime(o.expiry),
			aud: o.audience,
			sub: this.thumbprint,
			data: {name: this.name, publicKey: this.keypairJson.publicKey},
		})
	}
}

