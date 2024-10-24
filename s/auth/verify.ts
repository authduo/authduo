
import {Pubkey} from "./pubkey.js"
import {AccessJwtPayload, Login} from "./types.js"
import {JsonWebToken} from "./utils/json-web-token.js"

export async function verify(token: string): Promise<Login | null> {
	try {
		const {payload} = JsonWebToken.decode<AccessJwtPayload>(token)
		const {exp, sub: thumbprint} = payload
		const {name, publicKey} = payload.data

		const pubkey = await Pubkey.fromJson({thumbprint, publicKey})
		await pubkey.verify(token)

		return {
			token,
			name,
			publicKey,
			thumbprint,
			audience: payload.aud,
			expiry: JsonWebToken.toJsTime(exp),
		}
	}
	catch {
		return null
	}
}

export function isExpired(token: string) {
	const {payload} = JsonWebToken.decode<AccessJwtPayload>(token)
	const expired = JsonWebToken.toJsTime(payload.exp)
	return Date.now() > expired
}

