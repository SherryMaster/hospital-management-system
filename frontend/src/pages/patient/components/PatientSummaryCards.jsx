/**
 * PatientSummaryCards Component
 * 
 * Standardized summary cards grid for patient pages
 */

import React from 'react';
import {
  Grid,
  Box,
} from '@mui/material';
import PatientStatCard from './PatientStatCard';

const PatientSummaryCards = ({
  cards = [],
  spacing = 3,
  loading = false,
  error = null,
  sx = {},
}) => {
  if (!cards || cards.length === 0) return null;

  return (
    <Box sx={{ mb: 4, ...sx }}>
      <Grid container spacing={spacing}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={card.gridSize || 3} key={card.id || index}>
            <PatientStatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color || 'primary'}
              action={card.action}
              trend={card.trend}
              subtitle={card.subtitle}
              onClick={card.onClick}
              loading={loading}
              error={error}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PatientSummaryCards;
