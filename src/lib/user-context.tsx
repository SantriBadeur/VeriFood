'use client';

import React, { createContext, useContext } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RELAWAN';
}

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}

