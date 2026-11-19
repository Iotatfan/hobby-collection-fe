import { Box, Flex, Grid, Icon, Skeleton, Stat } from '@chakra-ui/react';
import { BoxIcon, CheckCircle2, Clock, Star } from 'lucide-react';
import { Fragment } from 'react';
import useCollectionStatistics from '../hooks/useCollectionStatistics';

interface StatisticsSectionProps {
  variant?: 'light' | 'dark';
}

const StatisticsSection = ({ variant = 'light' }: StatisticsSectionProps) => {
  const { statistics, isLoading, isError } = useCollectionStatistics();
  const isDark = variant === 'dark';
  const metrics = [
    { label: 'Total Items', value: statistics?.total_count, icon: BoxIcon, color: '#5B6CF6' },
    {
      label: 'Completed',
      value: statistics?.completed_count,
      icon: CheckCircle2,
      color: '#38A169',
    },
    { label: 'Backlog', value: statistics?.backlog_count, icon: Clock, color: '#D97706' },
    { label: 'P-Bandai / Limited', value: statistics?.limited_count, icon: Star, color: '#805AD5' },
  ];
  if (isError) return null;

  return (
    <Box
      mt={3}
      borderWidth="1px"
      borderColor={isDark ? 'shelves.border' : 'gray.200'}
      borderRadius="xl"
      bg={isDark ? 'shelves.raised' : 'transparent'}
      color={isDark ? 'shelves.text' : undefined}
      py={{ base: 4, md: 5 }}
      boxShadow={isDark ? 'none' : 'sm'}
      overflowX={isDark ? undefined : 'auto'}
    >
      <Grid
        display={isDark ? 'grid' : 'flex'}
        templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }}
        alignItems="center"
        justifyContent="space-evenly"
        gap={isDark ? { base: 5, md: 0 } : 0}
        w="full"
      >
        {metrics.map(({ label, value, icon, color }, index) => (
          <Fragment key={label}>
            {!isDark && index > 0 && <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />}
            <Flex
              align="center"
              gap={2}
              px={{ base: 2, md: 4 }}
              minW={0}
              borderLeftWidth={
                isDark && index > 0 ? { base: index % 2 ? '1px' : '0', md: '1px' } : '0'
              }
              borderColor="shelves.border"
            >
              {isLoading ? (
                <>
                  <Skeleton boxSize="28px" flexShrink={0} borderRadius="md" />
                  <Flex direction="column" gap={1}>
                    <Skeleton h="24px" w="40px" />
                    <Skeleton h="14px" w="64px" />
                  </Flex>
                </>
              ) : (
                <>
                  <Icon as={icon} flexShrink={0} boxSize={isDark ? 7 : 9} color={color} />
                  <Stat.Root gap={0} minW={0}>
                    <Stat.ValueText>{value ?? 0}</Stat.ValueText>
                    <Stat.Label
                      color={isDark ? 'shelves.muted' : undefined}
                      fontSize="sm"
                      whiteSpace="normal"
                    >
                      {label}
                    </Stat.Label>
                  </Stat.Root>
                </>
              )}
            </Flex>
          </Fragment>
        ))}
      </Grid>
    </Box>
  );
};
export default StatisticsSection;
