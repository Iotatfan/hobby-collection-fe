import { Box, Flex, Skeleton, Stat } from '@chakra-ui/react';
import { BoxIcon, CheckCircle2, Clock, Star } from 'lucide-react';
import useCollectionStatistics from '../hooks/useCollectionStatistics';

const StatValueSkeleton = () => (
  <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
    <Skeleton boxSize="36px" borderRadius="md" />
    <Flex direction="column" gap={1}>
      <Skeleton h="24px" w="40px" borderRadius="md" />
      <Skeleton h="14px" w="64px" borderRadius="md" />
    </Flex>
  </Flex>
);

const StatisticsSection: React.FC = () => {
  const { statistics, isLoading, isError } = useCollectionStatistics();

  if (isError) return null;

  return (
    <Box
      mt={3}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="transparent"
      py={{ base: 3, md: 6 }}
      boxShadow="sm"
      overflowX="auto"
    >
      <Flex align="center" justify="space-evenly" w="full">
        {isLoading ? (
          <>
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />
            <StatValueSkeleton />
            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />
            <StatValueSkeleton />
          </>
        ) : (
          <>
            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <BoxIcon size={36} color="#5B6CF6" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.total_count ?? 0}</Stat.ValueText>
                <Stat.Label>Total Items</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <CheckCircle2 size={36} color="#38A169" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.completed_count ?? 0}</Stat.ValueText>
                <Stat.Label>Completed</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <Clock size={36} color="#D97706" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.backlog_count ?? 0}</Stat.ValueText>
                <Stat.Label>Backlog</Stat.Label>
              </Stat.Root>
            </Flex>

            <Box w="1px" h="36px" bg="gray.200" flexShrink={0} />

            <Flex align="center" gap={2} px={{ base: 3, md: 4 }}>
              <Star size={36} color="#805AD5" />
              <Stat.Root gap={0}>
                <Stat.ValueText>{statistics?.limited_count ?? 0}</Stat.ValueText>
                <Stat.Label>P-Bandai / Limited</Stat.Label>
              </Stat.Root>
            </Flex>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default StatisticsSection;
