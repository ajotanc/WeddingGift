import { DATABASE_ID, getFaqSchedulePermissions, tables } from "@/lib/appwrite";
import { TABLE_QUIZZES } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";

export interface IQuizQuestion extends Models.Row {
	tenant: string;
	question: string;
	options: string[];
	correct_index: number;
	order?: number;
}

export const QuizService = {
	async list(tenantId: string): Promise<IQuizQuestion[]> {
		const res = await tables.listRows<IQuizQuestion>({
			databaseId: DATABASE_ID,
			tableId: TABLE_QUIZZES,
			queries: [
				Query.equal("tenant", tenantId),
				Query.orderAsc("order"),
				Query.orderDesc("$createdAt"),
				Query.limit(100),
			],
		});
		return res.rows;
	},

	async create(
		data: Omit<IQuizQuestion, keyof Models.Row>,
	): Promise<IQuizQuestion> {
		const ownerId = data.tenant;
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_QUIZZES,
			rowId: ID.unique(),
			data,
			permissions: getFaqSchedulePermissions(ownerId),
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_QUIZZES,
			rowId: id,
		});
	},

	async update(
		id: string,
		data: Partial<IQuizQuestion>,
	): Promise<IQuizQuestion> {
		const existing = await tables.getRow<IQuizQuestion>({
			databaseId: DATABASE_ID,
			tableId: TABLE_QUIZZES,
			rowId: id,
		});
		const ownerId = existing?.tenant || data.tenant || "";

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_QUIZZES,
			rowId: id,
			data,
			permissions: getFaqSchedulePermissions(ownerId),
		});
	},
};
