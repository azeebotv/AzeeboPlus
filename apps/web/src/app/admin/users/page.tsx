'use client';
import React from 'react';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  contentCount?: number;
  subscriberCount?: number;
}

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UsersPage(): JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<PaginatedUsers>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, user, router, users.page, search, role]);

  const fetchUsers = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await api.admin.getUsers(users.page, users.limit);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch users');
      }

      const { items, total, page, limit } = response.data;

      setUsers({
        items: items as User[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number): void => {
    setUsers((prev) => ({ ...prev, page }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
    setUsers((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setRole(e.target.value);
    setUsers((prev) => ({ ...prev, page: 1 }));
  };

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <></>; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold">Azeebo+ Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{user.name}</span>
            <button className="text-white hover:text-gray-200 transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border h-screen sticky top-16">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a
                  href="/admin"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                  </svg>
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/users"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md bg-primary/10 text-primary font-medium"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <span>Users</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/content"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                  <span>Content</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/creators"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>Creators</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/payments"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                  <span>Payments</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/analytics"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                  </svg>
                  <span>Analytics</span>
                </a>
              </li>
              <li>
                <a
                  href="/admin/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                  </svg>
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">User Management</h2>

          {/* Filter and Search */}
          <div className="bg-card rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search users by name or email"
                />
              </div>
              <div className="w-48">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <button className="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                  Add User
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-card rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-10 w-32 bg-muted rounded-md"></div>
                  </div>
                ))}
              </div>

              {/* Pagination Skeleton */}
              <div className="mt-8 flex justify-center">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-10 w-10 bg-muted rounded-md"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">Error</h3>
                  <div className="mt-2 text-sm text-destructive">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg p-6">
              {users.items.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {users.items.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 p-4 border border-border rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-12 w-12 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{user.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {user.email} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {user.isVerified && (
                              <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                                Verified
                              </span>
                            )}
                            {user.lastLogin && (
                              <span className="text-xs text-muted-foreground">
                                Last login: {new Date(user.lastLogin).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted transition-colors">
                            Edit
                          </button>
                          <button className="px-3 py-1 text-sm bg-destructive text-white rounded-md hover:bg-destructive/90 transition-colors">
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {users.totalPages > 1 && (
                    <div className="mt-8 flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Showing {users.items.length} of {users.total} results
                      </p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handlePageChange(1)}
                          disabled={users.page === 1}
                          className="px-3 py-1 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          First
                        </button>
                        <button
                          onClick={() => handlePageChange(users.page - 1)}
                          disabled={users.page === 1}
                          className="px-3 py-1 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, users.totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 border rounded-md transition-colors ${users.page === page ? 'bg-primary text-white' : 'border-border hover:bg-muted'}`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(users.page + 1)}
                          disabled={users.page === users.totalPages}
                          className="px-3 py-1 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Next
                        </button>
                        <button
                          onClick={() => handlePageChange(users.totalPages)}
                          disabled={users.page === users.totalPages}
                          className="px-3 py-1 border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
