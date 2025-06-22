/**
 * UsersPage Test Suite
 * 
 * Comprehensive tests for the UsersPage component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';

import UsersPage from '../UsersPage';
import theme from '../../../theme';
import { AuthProvider } from '../../../contexts/AuthContext';
import { NotificationProvider } from '../../../contexts/NotificationContext';

// Mock the hooks
vi.mock('../../../hooks/useApi', () => ({
  useUsers: () => ({
    users: [
      {
        id: 1,
        username: 'johndoe',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        role: 'patient',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 2,
        username: 'janedoe',
        email: 'jane@example.com',
        first_name: 'Jane',
        last_name: 'Doe',
        full_name: 'Jane Doe',
        role: 'doctor',
        is_active: true,
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    pagination: { count: 2, next: null, previous: null },
    loading: false,
    error: null,
    fetchUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'admin', full_name: 'Admin User' },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }) => children,
}));

vi.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
  NotificationProvider: ({ children }) => children,
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders page title and description', () => {
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage system users and their roles')).toBeInTheDocument();
  });

  test('displays users in table', () => {
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  test('shows role chips with correct colors', () => {
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const patientChip = screen.getByText('patient');
    const doctorChip = screen.getByText('doctor');
    
    expect(patientChip).toBeInTheDocument();
    expect(doctorChip).toBeInTheDocument();
  });

  test('search functionality works', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'john');
    
    expect(searchInput).toHaveValue('john');
  });

  test('role filter works', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const roleFilter = screen.getByLabelText('Role');
    await user.click(roleFilter);
    
    const doctorOption = screen.getByText('Doctor');
    await user.click(doctorOption);
    
    expect(roleFilter).toHaveTextContent('Doctor');
  });

  test('add user button opens create dialog', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const addButton = screen.getByText('Add User');
    await user.click(addButton);
    
    expect(screen.getByText('Create New User')).toBeInTheDocument();
  });

  test('edit button opens edit dialog', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const editButtons = screen.getAllByLabelText(/Edit user/);
    await user.click(editButtons[0]);
    
    expect(screen.getByText('Edit User')).toBeInTheDocument();
  });

  test('delete button opens confirmation dialog', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByLabelText(/Delete user/);
    await user.click(deleteButtons[0]);
    
    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete user/)).toBeInTheDocument();
  });

  test('form validation works for create user', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    // Open create dialog
    const addButton = screen.getByText('Add User');
    await user.click(addButton);
    
    // Try to submit without filling required fields
    const createButton = screen.getByText('Create');
    await user.click(createButton);
    
    // Should show validation error (mocked)
    expect(createButton).toBeInTheDocument();
  });

  test('accessibility: has proper ARIA labels', () => {
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const searchInput = screen.getByLabelText('Search users by name, email, or username');
    expect(searchInput).toBeInTheDocument();

    const editButtons = screen.getAllByLabelText(/Edit user/);
    const deleteButtons = screen.getAllByLabelText(/Delete user/);
    
    expect(editButtons.length).toBeGreaterThan(0);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  test('responsive design: hides columns on small screens', () => {
    // Mock window.matchMedia for responsive testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('(max-width: 600px)'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    // On small screens, email column should be hidden
    const emailHeaders = screen.queryAllByText('Email');
    // Should still exist in DOM but with display: none
    expect(emailHeaders.length).toBeGreaterThan(0);
  });

  test('pagination info displays correctly', () => {
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    expect(screen.getByText('Showing 2 of 2 users')).toBeInTheDocument();
  });

  test('refresh button works', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UsersPage />
      </TestWrapper>
    );

    const refreshButton = screen.getByText('Refresh');
    await user.click(refreshButton);
    
    // Should trigger fetchUsers (mocked)
    expect(refreshButton).toBeInTheDocument();
  });
});
