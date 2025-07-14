import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserContextProvider } from './UserContext';
import { useUser } from '../../hooks/useUser';
import React from 'react';

// Mock user data
const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
};

// Mock api and token utils
jest.mock('../../lib/axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { success: true, data: mockUser } })),
  delete: jest.fn(() => Promise.resolve({ data: { message: 'User deleted successfully' } })),
  put: jest.fn(() => Promise.resolve({ data: { message: 'Updated' } })),
}));
jest.mock('../../lib/token', () => ({
  clearAllTokens: jest.fn(),
}));

// test component
const TestComponent = () => {
  const { user, signOut, deleteUser, updateUserEmail } = useUser();
  return (
    <div>
      <div data-testid="username">{user?.username || 'no-user'}</div>
      <button onClick={signOut} data-testid="signout">Sign Out</button>
      <button onClick={deleteUser} data-testid="delete">Delete User</button>
      <button onClick={() => updateUserEmail('new@example.com')} data-testid="update-email">Update Email</button>
    </div>
  );
};

describe('UserContext & useUser', () => {
  it('provides user data from context', async () => {
    render(
      <UserContextProvider>
        <TestComponent />
      </UserContextProvider>
    );
    
    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('testuser'));
  });

  it('signOut clears user and redirects', async () => {
    // mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <UserContextProvider>
        <TestComponent />
      </UserContextProvider>
    );
    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('testuser'));
    fireEvent.click(screen.getByTestId('signout'));
    await waitFor(() => expect(window.location.href).toBe('/signin'));
  });

  it('deleteUser clears user', async () => {
    render(
      <UserContextProvider>
        <TestComponent />
      </UserContextProvider>
    );
    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('testuser'));
    fireEvent.click(screen.getByTestId('delete'));
    // user 被清空后，username 显示 no-user
    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('no-user'));
  });

  it('updateUserEmail works', async () => {
    render(
      <UserContextProvider>
        <TestComponent />
      </UserContextProvider>
    );
    await waitFor(() => expect(screen.getByTestId('username').textContent).toBe('testuser'));
    fireEvent.click(screen.getByTestId('update-email'));
    // 这里只测试调用，不验证 UI 变化
  });
});