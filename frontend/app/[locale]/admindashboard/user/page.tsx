"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type Role = {
	id: number;
	name: string;
};

type User = {
	id: number;
	username: string;
	roleid: number;
	role_name: string;
};

type FormState = {
	username: string;
	password: string;
	roleid: string;
};

type ModalMode = "create" | "edit" | "delete" | null;

const API_BASE = "http://127.0.0.1:8000/api/admin";

export default function AdminUserManagementPage() {
	const locale = useLocale();
	const [roles, setRoles] = useState<Role[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [form, setForm] = useState<FormState>({
		username: "",
		password: "",
		roleid: "",
	});
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [modalMode, setModalMode] = useState<ModalMode>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");

	const authHeaders = useMemo<Record<string, string>>(() => {
		const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
		const headers: Record<string, string> = {};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		return headers;
	}, []);

	const loadRoles = async () => {
		const response = await fetch(`${API_BASE}/roles`, { headers: authHeaders });
		if (!response.ok) {
			throw new Error("Failed to load roles");
		}
		const data: Role[] = await response.json();
		setRoles(data);
		if (!form.roleid && data.length > 0) {
			setForm((prev) => ({ ...prev, roleid: String(data[0].id) }));
		}
	};

	const loadUsers = async () => {
		const response = await fetch(`${API_BASE}/users`, { headers: authHeaders });
		if (!response.ok) {
			throw new Error("Failed to load users");
		}
		const data: User[] = await response.json();
		setUsers(data);
	};

	const refresh = async () => {
		setError(null);
		try {
			await Promise.all([loadRoles(), loadUsers()]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load data");
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	const resetForm = () => {
		setEditingUser(null);
		setForm({ username: "", password: "", roleid: roles[0] ? String(roles[0].id) : "" });
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const payload: Record<string, unknown> = {
				username: form.username,
				roleid: Number(form.roleid),
			};

			if (!editingUser || form.password) {
				payload.password = form.password;
			}

			const endpoint = editingUser ? `${API_BASE}/users/${editingUser.id}` : `${API_BASE}/users`;
			const method = editingUser ? "PUT" : "POST";
			const response = await fetch(endpoint, {
				method,
				headers: {
					"Content-Type": "application/json",
					...authHeaders,
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(data?.detail || "Save failed");
			}

			setSuccess(editingUser ? "Updated user" : "Created user");
			resetForm();
			await loadUsers();
			setModalMode(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Save failed");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setForm({ username: user.username, password: "", roleid: String(user.roleid) });
		setModalMode("edit");
	};

	const handleDelete = async () => {
		if (!editingUser) {
			return;
		}
		setLoading(true);
		setError(null);
		setSuccess(null);
		try {
			const response = await fetch(`${API_BASE}/users/${editingUser.id}`, {
				method: "DELETE",
				headers: authHeaders,
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) {
				throw new Error(data?.detail || "Delete failed");
			}
			setSuccess("Deleted user");
			await loadUsers();
			setModalMode(null);
			setEditingUser(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setLoading(false);
		}
	};

	const openCreateModal = () => {
		resetForm();
		setModalMode("create");
	};

	const openDeleteModal = (user: User) => {
		setEditingUser(user);
		setModalMode("delete");
	};

	return (
		<div className="min-h-[calc(100vh-56px)] bg-gray-100 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
			<div className="mx-auto w-full max-w-none space-y-6">
				{error ? <p className="text-sm text-red-600">{error}</p> : null}
				{success ? <p className="text-sm text-green-600">{success}</p> : null}

				<div className="rounded-lg bg-white p-5 shadow sm:p-6">
					<h2 className="text-lg font-semibold text-gray-900">Users</h2>
					<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
						<div className="w-full sm:max-w-md">
							<label className="text-sm font-semibold text-gray-700">Search by username</label>
							<input
								className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
								placeholder="Search..."
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
							/>
						</div>
						<div className="flex flex-wrap gap-2">
							<button
								className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
								onClick={openCreateModal}
								disabled={loading}
							>
								Create user
							</button>
							<button
								className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
								onClick={refresh}
								disabled={loading}
							>
								Refresh
							</button>
						</div>
					</div>
					<div className="mt-4 overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600">
								<tr>
									<th className="px-4 py-3">ID</th>
									<th className="px-4 py-3">Username</th>
									<th className="px-4 py-3">Role</th>
									<th className="px-4 py-3">Actions</th>
								</tr>
							</thead>
							<tbody>
								{users
									.filter((user) =>
										user.username.toLowerCase().includes(searchTerm.trim().toLowerCase())
									)
									.map((user) => (
									<tr key={user.id} className="border-t border-gray-200">
										<td className="px-4 py-3 text-gray-700">{user.id}</td>
										<td className="px-4 py-3 text-gray-700">{user.username}</td>
										<td className="px-4 py-3 text-gray-700">{user.role_name}</td>
										<td className="px-4 py-3">
											<div className="flex flex-wrap gap-2">
												<button
													className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
													onClick={() => handleEdit(user)}
												>
													Edit
												</button>
												<button
													className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
													onClick={() => openDeleteModal(user)}
												>
													Delete
												</button>
											</div>
										</td>
									</tr>
									))}
									{users.filter((user) =>
										user.username.toLowerCase().includes(searchTerm.trim().toLowerCase())
									).length === 0 ? (
									<tr>
										<td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>
												No users found.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{modalMode ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
						{modalMode === "delete" ? (
							<>
								<h3 className="text-lg font-semibold text-gray-900">Delete user</h3>
								<p className="mt-2 text-sm text-gray-600">
									Delete user <strong>{editingUser?.username}</strong>?
								</p>
								<div className="mt-6 flex justify-end gap-3">
									<button
										className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
										onClick={() => setModalMode(null)}
										disabled={loading}
									>
										Cancel
									</button>
									<button
										className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
										onClick={handleDelete}
										disabled={loading}
									>
										Delete
									</button>
								</div>
							</>
						) : (
							<>
								<h3 className="text-lg font-semibold text-gray-900">
									{modalMode === "create" ? "Create user" : "Edit user"}
								</h3>
								<div className="mt-4 grid gap-4 sm:grid-cols-2">
									<div className="sm:col-span-2">
										<label className="text-sm font-semibold text-gray-700">Username</label>
										<input
											className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
											value={form.username}
											onChange={(event) =>
												setForm((prev) => ({ ...prev, username: event.target.value }))
											}
										/>
									</div>
									<div className="sm:col-span-2">
										<label className="text-sm font-semibold text-gray-700">Role</label>
										<select
											className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
											value={form.roleid}
											onChange={(event) =>
												setForm((prev) => ({ ...prev, roleid: event.target.value }))
											}
										>
											{roles.map((role) => (
												<option key={role.id} value={role.id}>
													{role.name}
												</option>
											))}
										</select>
									</div>
									<div className="sm:col-span-2">
										<label className="text-sm font-semibold text-gray-700">
											Password {modalMode === "edit" ? "(leave blank to keep)" : ""}
										</label>
										<input
											type="password"
											className="mt-2 w-full rounded border border-gray-300 p-2 text-sm"
											value={form.password}
											onChange={(event) =>
												setForm((prev) => ({ ...prev, password: event.target.value }))
											}
										/>
									</div>
								</div>

								{error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

								<div className="mt-6 flex justify-end gap-3">
									<button
										className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
										onClick={() => setModalMode(null)}
										disabled={loading}
									>
										Cancel
									</button>
									<button
										className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
										onClick={handleSubmit}
										disabled={
											loading ||
											!form.username ||
											(modalMode === "create" && !form.password)
										}
									>
										{modalMode === "create" ? "Create" : "Update"}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
