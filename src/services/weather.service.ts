import dayjs from "dayjs";

export interface IWeatherData {
	maxTemp: number;
	minTemp: number;
	description: string;
	icon: string;
}

const weatherCodeMap: Record<number, { description: string; icon: string }> = {
	0: { description: "Céu Limpo", icon: "sun" },
	1: { description: "Limpo a Nublado", icon: "cloud-sun" },
	2: { description: "Parcialmente Nublado", icon: "cloud-sun" },
	3: { description: "Encoberto", icon: "cloud" },
	45: { description: "Nevoeiro", icon: "cloud" },
	48: { description: "Nevoeiro com Geada", icon: "cloud" },
	51: { description: "Chuva Leve", icon: "cloud-drizzle" },
	53: { description: "Garoa", icon: "cloud-drizzle" },
	55: { description: "Garoa Forte", icon: "cloud-drizzle" },
	61: { description: "Chuva Fraca", icon: "cloud-rain" },
	63: { description: "Chuva Moderada", icon: "cloud-rain" },
	65: { description: "Chuva Forte", icon: "cloud-rain" },
	80: { description: "Pancadas de Chuva Fracas", icon: "cloud-rain" },
	81: { description: "Pancadas de Chuva", icon: "cloud-rain" },
	82: { description: "Pancadas de Chuva Fortes", icon: "cloud-rain" },
	95: { description: "Trovoada", icon: "cloud-lightning" },
	96: { description: "Trovoada com Granizo", icon: "cloud-lightning" },
	99: { description: "Tempestade com Granizo", icon: "cloud-lightning" },
};

export const WeatherService = {
	async getForecast(
		latitude: number,
		longitude: number,
		dateStr: string, // YYYY-MM-DD
	): Promise<IWeatherData | null> {
		const today = dayjs().startOf("day");
		const eventDate = dayjs(dateStr).startOf("day");

		if (!eventDate.isValid()) return null;

		const diffDays = eventDate.diff(today, "day");

		// 1. Ajustado para 14 dias (limite real da API)
		if (diffDays < 0 || diffDays > 14) {
			console.warn("Requisição cancelada: Data fora do intervalo de 14 dias.");
			return null;
		}

		try {
			const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
			const response = await fetch(url);

			if (!response.ok) {
				console.error("API erro HTTP:", response.status);
				return null;
			}

			const data = await response.json();

			// 2. Log de Debug (Fundamental para saber por que está vindo null)
			if (!data.daily || !data.daily.time) {
				console.error("API retornou dados inesperados:", data);
				return null;
			}

			const formattedDate = eventDate.format("YYYY-MM-DD");
			const timeIndex = data.daily.time.indexOf(formattedDate);

			// Se der -1, significa que a API não tem previsão para essa data específica
			if (timeIndex === -1) {
				console.warn(`Data ${formattedDate} não encontrada na resposta da API.`);
				return null;
			}

			const maxTemp = data.daily.temperature_2m_max[timeIndex];
			const minTemp = data.daily.temperature_2m_min[timeIndex];
			const code = data.daily.weathercode[timeIndex];

			const mapped = weatherCodeMap[code] || {
				description: "Instável",
				icon: "cloud",
			};

			return {
				maxTemp,
				minTemp,
				description: mapped.description,
				icon: mapped.icon,
			};
		} catch (error) {
			console.error("Erro na busca da previsão:", error);
			return null;
		}
	},
};
