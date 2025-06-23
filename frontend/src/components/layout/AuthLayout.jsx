/**
 * AuthLayout Component
 * 
 * Layout for authentication pages (login, register, etc.)
 */

import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';

const AuthLayout = ({ children, title, subtitle, maxWidth = "lg" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: {
            xs: '95%',
            sm: '500px',
            md: maxWidth === 'sm' ? '600px' : '900px',
            lg: maxWidth === 'sm' ? '600px' : '1100px',
            xl: maxWidth === 'sm' ? '600px' : '1300px'
          },
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: { xs: 3, md: 4 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
              }}
            >
              <HospitalIcon
                sx={{
                  fontSize: { xs: 36, md: 48 },
                  color: 'primary.main',
                }}
              />
              <Typography
                variant="h4"
                component="h1"
                fontWeight="bold"
                color="primary.main"
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                HMS
              </Typography>
            </Box>

            <Typography
              variant="h5"
              component="h2"
              fontWeight="600"
              color="text.primary"
              textAlign="center"
              gutterBottom
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{
                  maxWidth: { xs: 300, md: 600 },
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Content */}
          {children}

          {/* Footer */}
          <Box sx={{ mt: { xs: 3, md: 4 }, textAlign: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}
            >
              Hospital Management System © 2025
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthLayout;
