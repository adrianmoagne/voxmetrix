import type { BaseTranslation } from "../i18n-types.js";

const pt_BR = {
	App: "VoxMetrix",
	Roles: {
		Admin: "Administrador",
		Participant: "Participante",
	},
	Login: {
		Title: "Olá, insira suas credenciais para entrar.",
		Placeholders: {
			Email: "Email",
			Password: "Senha",
		},
	},
	SignUp: {
		AccountTitle: "Vamos criar suas credenciais.",
		PersonalTitle: "Bem-vindo, conte-nos quem você é.",
		Placeholders: {
			Name: "Nome",
			Institution: "Instituição",
			Phone: "Telefone",
			Email: "Email",
			Password: "Senha",
			Description: "Sobre você... propósitos...",
			ConfirmPassword: "Confirmar senha",
		},
	},
	Forms: {
		Title: "Formulários",
		Subtitle: "Gerencie formulários e resultados.",
		Filters: {
			All: "Todos",
			InUse: "Em uso",
			Status: "Status",
			Disabled: "Desativado",
			Enabled: "Ativado",
		},
		Headers: {
			ID: "ID",
			Alias: "Apelido",
			Items: "Itens",
			UsedIn: "Usado em",
			Results: "Resultados",
			Status: "Status",
			CreatedAt: "Criado em",
			Actions: "Ações",
		},
		Buttons: {
			Build: "Construir",
		},
	},
	Medias: {
		Title: "Mídias",
		Subtitle: "Veja todas as suas imagens e arquivos de áudio.",
		Filters: {
			All: "Todas",
			Audio: "Áudio",
			Image: "Imagem",
			InUse: "Em uso",
			Name: "Nome",
			Size: "Tamanho",
		},
	},
	Build: {
		Title: "Construção",
		Subtitle: "Gerencie suas construções de TTS e arquivos de áudio gerados.",
		Filters: {
			All: "Todos",
			Mine: "Meus",
		},
		Headers: {
			ID: "ID",
			Alias: "Apelido",
			Participants: "Participantes",
			Experiments: "Experimentos",
			UsedIn: "Usado em",
			Actions: "Ações",
		},
	},
	Modals: {
		MediaViewer: {
			Title: "Visualizador de Mídia",
			Details: {
				Subtitle: "Detalhes",
				Type: "Tipo",
				Filename: "Nome do arquivo",
				Size: "Tamanho",
				UploadAt: "Enviado em",
				URL: "URL",
				UsedIn: "Usado em",
				Extension: "Extensão",
			},
			Of: "de {total:number} mídias",
		},
		AppSettings: {
			Language: "Idioma",
			ChangeLanguage: "Alterar idioma do aplicativo",
			Theme: "Tema",
			ChangeTheme: "Alterar aparência do aplicativo",
			Light: "Claro",
			Dark: "Escuro",
		},
	},
	Buttons: {
		Next: "Próximo",
		Back: "Voltar",
		Submit: "Enviar",
		Enter: "Entrar",
		Upload: "Enviar",
		Download: "Baixar",
		Delete: "Excluir",
		New: "Novo",
	},
	Sidebar: {
		Search: "Pesquisar",
		Nav: {
			Projects: "Projetos",
			Medias: "Mídias",
			Forms: "Formulários",
			Build: "Construir",
		},
	},
	Breadcrumbs: {
		admin: "Administrador",
		projects: "Projetos",
		medias: "Mídias",
		forms: "Formulários",
		builder: "Construtor",
		create: "Criar",
		edit: "Editar",
	},
	SystemErrors: {
		InvalidEmail: "Endereço de email inválido.",
		InvalidPassword: "A senha não atende aos requisitos. Mínimo de {minLength:number} caracteres.",
		InvalidConfirmPassword: "As senhas não coincidem.",
		RequiredField: "O campo {name:string} é obrigatório.",
	},
	Links: {
		SignUp: "Criar conta",
		Login: "Entrar",
	},
	UserControl: {
		Logout: "Sair",
		Settings: "Configurações",
	},
	Languages: {
		English: "Inglês",
		Portuguese: "Português",
	},
} satisfies BaseTranslation;

export default pt_BR;
