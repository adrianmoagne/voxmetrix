import { BorderCard, ButtonSwitch, Logo } from "@/components";
import { useI18nContext } from "@/i18n/i18n-react";
import S from "./Login.styles";
import { Button, Input, Typography, useTheme } from "@leux/ui";
import { useLocation, useNavigate } from "react-router";
import { Pages } from "@/@types";
import { useForm } from "react-hook-form";
import { AuthService } from "@/api/services/AuthService";
import { authActions, type StoreDispatch } from "@/store";
import { useDispatch } from "react-redux";

const Login: React.FC = () => {
	const { LL } = useI18nContext();
	const { theme } = useTheme();
	const dispatch = useDispatch<StoreDispatch>();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { register, formState, getValues, handleSubmit } = useForm({ mode: "all" });

	const fields = {
		email: register("email", {
			required: true,
		}),
		password: register("password", {
			required: true,
		}),
	};

	const goTo = (key: string) => {
		navigate(key);
	};

	const onSubmit = async () => {
		const { email, password } = getValues();
		try {
			await AuthService.login(email, password);
			dispatch(authActions.fetchCurrentUser());
			navigate(Pages.Projects);
		} catch (err) {
			console.error("Login failed:", err);
		}
	};

	return (
		<S.Container>
			<BorderCard width={420} gap={18} alignItems="center">
				<Logo />
				<Typography variant="subtitle-2" textColor="textOne">
					{LL.Login.Title()}
				</Typography>

				<S.Form onSubmit={handleSubmit(onSubmit)}>
					<Input
						fieldKey="email"
						variant="outlined"
						type="email"
						customStyles={{
							padding: "18px 12px",
							borderColor: theme?.border,
							alignSelf: "stretch",
						}}
						inputProps={fields.email}
						placeholder={LL.Login.Placeholders.Email()}
					></Input>
					<Input
						fieldKey="password"
						variant="outlined"
						customStyles={{
							padding: "18px 12px",
							borderColor: theme?.border,
							alignSelf: "stretch",
						}}
						type="password"
						inputProps={fields.password}
						placeholder={LL.Login.Placeholders.Password()}
					></Input>
					<Button
						state={{
							disabled: formState.isSubmitting || !formState.isValid,
						}}
						customStyles={{
							alignSelf: "stretch",
						}}
						colorScheme="primary"
						type="submit"
					>
						{LL.Buttons.Enter()}
					</Button>
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

export default Login;
