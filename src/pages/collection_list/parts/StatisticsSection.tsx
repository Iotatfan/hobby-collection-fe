import { Box, Flex, Skeleton, Stat } from '@chakra-ui/react';
import { BoxIcon, CheckCircle2, Clock, Star } from 'lucide-react';
import useCollectionStatistics from '../hooks/useCollectionStatistics';

interface StatisticsSectionProps {
  variant?: 'light' | 'dark';
}

const StatValueSkeleton = () => (
  <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
    <Skeleton boxSize="36px" borderRadius="md" />
    <Flex direction="column" gap={1}>
      <Skeleton h="24px" w="40px" borderRadius="md" />
      <Skeleton h="14px" w="64px" borderRadius="md" />
    </Flex>
  </Flex>
);

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ variant = 'light' }) => {
  const { statistics, isLoading, isError } = useCollectionStatistics();
  const isDark = variant === 'dark';
  const borderColor = isDark ? 'whiteAlpha.200' : 'gray.200';
  const dividerColor = isDark ? 'whiteAlpha.200' : 'gray.200';
  const labelColor = isDark ? 'whiteAlpha.800' : undefined;

  if (isError) return null;

  return (
    <Box
      mt={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      bg={isDark ? 'rgba(17, 34, 64, 0.62)' : 'transparent'}
      color={isDark ? 'white' : undefined}
      py={{ base: 3, md: 6 }}
      boxShadow={isDark ? '0 18px 40px rgba(0, 0, 0, 0.28)' : 'sm'}
      overflowX="auto"
    >
      <Flex align="center" justify="space-evenly" w="full">
        {isLoading ? (
          <>
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />
            <StatValueSkeleton />
          </>
        ) : (
          <>
            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <BoxIcon size={36} color="#5B6CF6" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.total_count ?? 0}</Stat.ValueText>
                <Stat.Label color={labelColor}>Total Items</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <CheckCircle2 size={36} color="#38A169" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.completed_count ?? 0}</Stat.ValueText>
                <Stat.Label color={labelColor}>Completed</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <Clock size={36} color="#D97706" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.backlog_count ?? 0}</Stat.ValueText>
                <Stat.Label color={labelColor}>Backlog</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg={dividerColor} flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <Star size={36} color="#805AD5" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.limited_count ?? 0}</Stat.ValueText>
                <Stat.Label color={labelColor}>P-Bandai / Limited</Stat.Label>
              </Stat.Root>
            </Flex>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default StatisticsSection;
