
import {shadowComponent, html, loading} from "@benev/slate"

import {manager} from "../../context.js"
import {Passport} from "../../../auth/passport.js"
import {Situation} from "../../logic/situation.js"
import {EgressPage} from "../pages/egress/view.js"
import {svgSlate} from "../../../tools/svg-slate.js"
import {IngressPage} from "../pages/ingress/view.js"
import {ListPage} from "../../views/pages/list/view.js"
import {EditPage} from "../../views/pages/edit/view.js"
import {CreatePage} from "../../views/pages/create/view.js"
import {DeletePage} from "../../views/pages/delete/view.js"
import {PassportsFile} from "../../../auth/passports-file.js"
import {determinePurpose} from "../../logic/determine-purpose.js"

import stylesCss from "./styles.css.js"
import themeCss from "../../../common/theme.css.js"

import shieldOffIcon from "../../../common/icons/tabler/shield-off.icon.js"
import shieldCheckFilledIcon from "../../../common/icons/tabler/shield-check-filled.icon.js"

export const AuthManager = shadowComponent(use => {
	use.styles([themeCss, stylesCss])

	const {passportStore, storagePersistence} = manager
	const purpose = use.once(determinePurpose)
	const situationOp = use.op<Situation.Any>()

	use.once(() => storagePersistence.check())

	function gotoList() {
		situationOp.load(async() => ({
			kind: "list",
			passportStore,
			onEdit: gotoEdit,
			onCreate: gotoCreate,
			onEgress: passports => gotoEgress(passports, gotoList),
			onIngress: () => gotoIngress(undefined, gotoList),
		}))
	}

	async function gotoCreate() {
		const passport = await Passport.generate()
		situationOp.load(async() => ({
			kind: "create",
			passport,
			onCancel: gotoList,
			onComplete: passport => {
				passportStore.add(passport)
				storagePersistence.request()
				gotoList()
			},
		}))
	}

	function gotoEdit(passport: Passport) {
		situationOp.load(async() => ({
			kind: "edit",
			passport,
			onCancel: gotoList,
			onDelete: gotoDelete,
			onComplete: passport => {
				passportStore.add(passport)
				storagePersistence.request()
				gotoList()
			},
		}))
	}

	function gotoDelete(passport: Passport) {
		situationOp.load(async() => ({
			kind: "delete",
			passport,
			onCancel: gotoList,
			onComplete: passport => {
				passportStore.delete(passport)
				storagePersistence.request()
				gotoList()
			},
		}))
	}

	function gotoEgress(passports: Passport[], onBack: () => void) {
		situationOp.load(async() => ({
			kind: "egress",
			passports,
			onBack,
		}))
	}

	function gotoIngress(passports: PassportsFile | undefined, onBack: () => void) {
		situationOp.load(async() => ({
			kind: "ingress",
			passports,
			onBack,
			onAddPassports: passports => passportStore.add(...passports),
		}))
	}

	use.once(gotoList)

	const page = loading.braille(situationOp, situation => {switch (situation.kind) {
		case "list":
			return ListPage([situation, purpose])

		case "create":
			return CreatePage([situation])

		case "edit":
			return EditPage([situation])

		case "delete":
			return DeletePage([situation])

		case "egress":
			return EgressPage([situation])

		case "ingress":
			return IngressPage([situation])

		default:
			throw new Error("unknown situation")
	}})

	return html`
		${page}

		<footer>
			${storagePersistence.persisted.value ? html`
				<div class=persistence data-is-persisted>
					${svgSlate(shieldCheckFilledIcon)}
					<span>Browser storage persistence enabled</span>
				</div>
			` : html`
				<button class=persistence @click="${() => storagePersistence.request()}">
					${svgSlate(shieldOffIcon)}
					<span>Browser storage persistence disabled</span>
				</button>
			`}
		</footer>
	`
})

