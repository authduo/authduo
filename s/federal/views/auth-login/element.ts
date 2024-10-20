
import {attributes, GoldElement, html} from "@benev/slate"

import {auth} from "../../nexus.js"
import {Auth} from "../../auth/auth.js"
import stylesCss from "./styles.css.js"

export class AuthLogin extends GoldElement {
	static get styles() { return stylesCss }

	auth = auth
	#attrs = attributes(this as GoldElement, {src: String})

	get src() {
		return this.#attrs.src ?? Auth.url
	}

	set src(src: string) {
		this.#attrs.src = src
	}

	render() {
		const {auth} = this
		const {login} = auth
		const popup = () => auth.popup(this.#attrs.src)
		const logout = () => { auth.login = null }

		return html`
			<p>${login ? login.name : "logged out"}</p>

			${login
				? html`<button @click="${logout}">logout</button>`
				: html`<button @click="${popup}">login</button>`}
		`
	}
}

