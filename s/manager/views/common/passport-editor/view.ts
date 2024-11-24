
import {deep, html, shadowView} from "@benev/slate"

import stylesCss from "./styles.css.js"
import {whence} from "../../../../tools/whence.js"
import {Passport} from "../../../../auth/passport.js"
import themeCss from "../../../../common/theme.css.js"
import {IdView} from "../../../../common/views/id/view.js"
import {inputString} from "../../../../tools/input-string.js"
import {maxNameLength, validName} from "../../../../auth/utils/validation.js"

export const PassportEditor = shadowView(use => ({passport, onUpdate}: {
		passport: Passport
		onUpdate: (passport: Passport | null) => void
	}) => {

	use.styles([themeCss, stylesCss])

	const name = use.signal(passport.name)
	const valid = use.signal(true)

	function validate() {
		valid.value = validName(name.value)
		if (valid.value) {
			const draft = deep.clone(passport)
			draft.name = name.value
			onUpdate(draft)
		}
		else {
			onUpdate(null)
		}
	}

	function updateName(n: string) {
		name.value = n
		validate()
	}

	return html`
		<section class=form>
			<label>
				<strong>Public Name</strong>

				<input
					type=text
					.value="${name.value}"
					maxlength="${maxNameLength}"
					@input="${inputString(updateName)}"
					?data-angry="${!validName(name.value)}"
					/>

				${!validName(name.value) ? html`
					<small class=angry>invalid name</small>
				` : null}
			</label>

			<small>
				<span>${whence(passport.created)}</span>
				<span>${IdView([passport.thumbprint])}</span>
			</small>
		</section>
	`
})

