import { Pages, type IAccountForm, type IPersonalForm } from "@/@types";
import { BorderCard, ButtonSwitch, Logo } from "@/components";
import { useI18nContext } from "@/i18n/i18n-react";
import { maskPhoneNumber } from "@/utils";
import { Box, Button, Input, TextArea, Typography, useTheme } from "@leux/ui";
import { useState } from "react";
import { Eye, EyeOff } from "react-feather";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import S from "./SignUp.styles";
import { AuthService } from "@/api/services/AuthService";
const SignUp: React.FC = () => {
	const { LL } = useI18nContext();
	const { theme } = useTheme();

	const [passwordType, setPasswordType] = useState<"text" | "password">("password");
	const [confirmPasswordType, setConfirmPasswordType] = useState<"text" | "password">("password");

	const [step, setStep] = useState<"personal" | "account">("personal");

	const { pathname } = useLocation();
	const navigate = useNavigate();

	const personalForm = useForm<IPersonalForm>({ mode: "all" });
	const accountForm = useForm<IAccountForm>({ mode: "all" });

	const fields = {
		personal: {
			name: personalForm.register("name", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Name(),
					}),
				},
			}),
			institution: personalForm.register("institution", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Institution(),
					}),
				},
			}),
			phone: personalForm.register("phone", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Phone(),
					}),
				},
			}),
			description: personalForm.register("description"),
		},
		account: {
			email: accountForm.register("email", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Email(),
					}),
				},
				pattern: {
					value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
					message: LL.SystemErrors.InvalidEmail(),
				},
			}),
			username: accountForm.register("username", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Username(),
					}),
				},
			}),
			password: accountForm.register("password", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.Password(),
					}),
				},
				minLength: {
					value: 6,
					message: LL.SystemErrors.InvalidPassword({
						minLength: 6,
					}),
				},
			}),
			confirmPassword: accountForm.register("confirmPassword", {
				required: {
					value: true,
					message: LL.SystemErrors.RequiredField({
						name: LL.SignUp.Placeholders.ConfirmPassword(),
					}),
				},
				deps: ["password"],
				validate: (value, formValues) => {
					if (value !== formValues.password) {
						return LL.SystemErrors.InvalidConfirmPassword();
					}
					return true;
				},
			}),
		},
	};

	const goTo = (key: string) => {
		navigate(key);
	};

	const submit = async () => {
		const personalValues = personalForm.getValues();
		const accountValues = accountForm.getValues();

		try {
			await AuthService.register(
				accountValues.email,
				accountValues.password,
				accountValues.username,
				personalValues.name,
				personalValues.institution,
				personalValues.phone,
				personalValues.description
			);
			navigate(Pages.Login);
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<S.Container>
			<BorderCard width={420} gap={18} alignItems="center">
				<Logo />

				<Typography variant="subtitle-2" textColor="textOne">
					{step === "personal" ? LL.SignUp.PersonalTitle() : LL.SignUp.AccountTitle()}
				</Typography>

				<S.Form onSubmit={personalForm.handleSubmit(submit)}>
					{step === "personal" && (
						<>
							{Object.keys(personalForm.formState.errors).length > 0 && (
								<Typography variant="overline" textColor="danger">
									{personalForm.formState.errors.name?.message ||
										personalForm.formState.errors.institution?.message ||
										personalForm.formState.errors.phone?.message}
								</Typography>
							)}

							<Input
								fieldKey="name"
								variant="outlined"
								customStyles={{
									padding: "18px 12px",
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								inputProps={fields.personal.name}
								placeholder={LL.SignUp.Placeholders.Name()}
							></Input>
							<Input
								fieldKey="institution"
								variant="outlined"
								customStyles={{
									padding: "18px 12px",
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								inputProps={fields.personal.institution}
								placeholder={LL.SignUp.Placeholders.Institution()}
							></Input>
							<Input
								fieldKey="phone"
								variant="outlined"
								customStyles={{
									padding: "18px 12px",
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								inputProps={{
									...fields.personal.phone,
									onChange: (e) => {
										e.target.value = maskPhoneNumber(e.target.value);
										fields.personal.phone.onChange(e);
									},
								}}
								placeholder={LL.SignUp.Placeholders.Phone()}
							></Input>
							<TextArea
								fieldKey="password"
								variant="outlined"
								customStyles={{
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								textAreaProps={fields.personal.description}
								placeholder={LL.SignUp.Placeholders.Description()}
							></TextArea>
						</>
					)}

					{step === "account" && (
						<>
							{Object.keys(accountForm.formState.errors).length > 0 && (
								<Typography variant="overline" textColor="danger">
									{accountForm.formState.errors.email?.message ||
										accountForm.formState.errors.password?.message ||
										accountForm.formState.errors.confirmPassword?.message}
								</Typography>
							)}

							<Input
								fieldKey="email"
								variant="outlined"
								customStyles={{
									padding: "18px 12px",
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								inputProps={fields.account.email}
								placeholder={LL.SignUp.Placeholders.Email()}
							></Input>
							<Input
								fieldKey="username"
								variant="outlined"
								customStyles={{
									padding: "18px 12px",
									borderColor: theme?.border,
									alignSelf: "stretch",
								}}
								inputProps={fields.account.username}
								placeholder={LL.SignUp.Placeholders.Username()}
							></Input>
							<S.InputWrapper>
								<Input
									fieldKey="password"
									variant="outlined"
									type={passwordType}
									customStyles={{
										padding: "18px 12px",
										borderColor: theme?.border,
										alignSelf: "stretch",
									}}
									inputProps={fields.account.password}
									placeholder={LL.SignUp.Placeholders.Password()}
								/>
								<S.IconWrapper
									onClick={() => setPasswordType(passwordType === "password" ? "text" : "password")}
								>
									{passwordType === "password" ? (
										<Eye size={20} className="icon"></Eye>
									) : (
										<EyeOff size={20} className="icon"></EyeOff>
									)}
								</S.IconWrapper>
							</S.InputWrapper>
							<S.InputWrapper>
								<Input
									fieldKey="confirmPassword"
									variant="outlined"
									type={confirmPasswordType}
									customStyles={{
										padding: "18px 12px",
										borderColor: theme?.border,
										alignSelf: "stretch",
									}}
									inputProps={fields.account.confirmPassword}
									placeholder={LL.SignUp.Placeholders.ConfirmPassword()}
								/>
								<S.IconWrapper
									onClick={() =>
										setConfirmPasswordType(confirmPasswordType === "password" ? "text" : "password")
									}
								>
									{confirmPasswordType === "password" ? (
										<Eye size={20} className="icon"></Eye>
									) : (
										<EyeOff size={20} className="icon"></EyeOff>
									)}
								</S.IconWrapper>
							</S.InputWrapper>
						</>
					)}

					<Box flex flexDirection="row" width="100%" flexGap={12}>
						{step === "account" && (
							<>
								<Button
									customStyles={{
										width: "100%",
									}}
									type="button"
									colorScheme="default"
									onClick={() => setStep("personal")}
								>
									{LL.Buttons.Back()}
								</Button>
								<Button
									customStyles={{
										width: "100%",
									}}
									type="submit"
									colorScheme="primary"
									state={{
										disabled: accountForm.formState.isSubmitting || !accountForm.formState.isValid,
									}}
								>
									{LL.Buttons.Submit()}
								</Button>
							</>
						)}
						{step === "personal" && (
							<Button
								customStyles={{
									width: "100%",
								}}
								type="submit"
								colorScheme="primary"
								onClick={() => setStep("account")}
								state={{
									disabled: personalForm.formState.isSubmitting || !personalForm.formState.isValid,
								}}
							>
								{LL.Buttons.Next()}
							</Button>
						)}
					</Box>
				</S.Form>
			</BorderCard>
			<ButtonSwitch
				activeKey={pathname}
				onClick={goTo}
				buttons={[
					{ label: LL.Links.Login(), key: Pages.Login },
					{ label: LL.Links.SignUp(), key: Pages.SignUp },
				]}
			></ButtonSwitch>
		</S.Container>
	);
};

export default SignUp;
