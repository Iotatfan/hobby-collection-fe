import { Badge, Box, Button, Flex, Grid, HStack, Text } from '@chakra-ui/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ICollection } from '@/libs/collection/collection';
import {
  buildAddonLabels,
  resolveGradeBadge,
} from '@/pages/collection_detail/helpers/collectionDetail.helpers';
import ReleaseBadge from '@/pages/collection_list/parts/ReleaseBadge';
import { formatBuiltDateLabel } from '@/utils/date';

const MotionBox = motion.create(Box);
export default function DetailInformation({
  collection,
  fade,
}: {
  collection: ICollection;
  fade: boolean;
}) {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [long, setLong] = useState(false);
  const description = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    if (expanded) return;
    const check = () => {
      const node = description.current;
      setLong(Boolean(node && node.scrollHeight > node.clientHeight + 1));
    };
    const frame = requestAnimationFrame(check);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    if (description.current) observer?.observe(description.current);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [collection.description, expanded]);
  const rawScale = collection.type?.scale?.trim();
  const scale = rawScale && rawScale.toLowerCase() !== 'unknown scale' ? rawScale : undefined;
  const grade = resolveGradeBadge(collection.type?.grade?.name, scale, collection.type?.name);
  const acquired = ['1', '2'].includes(String(collection.status));
  const date = formatBuiltDateLabel(acquired ? collection.acquired_at : collection.built_at);
  const specs = [
    ['Scale', scale],
    ['Brand', collection.manufacturer?.name],
    ['Series', collection.series?.name],
    [acquired ? 'Acquired on' : 'Completed on', date],
  ];
  const addons = buildAddonLabels(collection.addons);
  return (
    <>
      {(grade.shouldShow || collection.release_type?.name) && (
        <HStack>
          {grade.shouldShow && (
            <Badge
              variant="solid"
              bg="cyan.900"
              color="cyan.100"
              fontSize="sm"
              fontWeight="bold"
              px={1.5}
              py={1}
            >
              {grade.label}
            </Badge>
          )}
          {collection.release_type?.name && (
            <ReleaseBadge
              release={collection.release_type.name}
              hideRegular
              fontSize="sm"
              fontWeight="bold"
              px={1.5}
              py={1}
            />
          )}
        </HStack>
      )}
      <Text
        as="h1"
        tabIndex={-1}
        fontSize={{ base: '2xl', lg: '4xl' }}
        fontWeight="bold"
        lineHeight="shorter"
      >
        {collection.title}
      </Text>
      <MotionBox
        w="full"
        minW={0}
        initial={fade && !reduced ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
      >
        {collection.description && (
          <Box w="full" mb={6}>
            <Box
              maxH={expanded ? { base: 'none', lg: '220px' } : { base: '160px', lg: '220px' }}
              overflowY={expanded ? { base: 'visible', lg: 'auto' } : 'hidden'}
              pr={expanded ? 2 : 0}
            >
              <Text
                ref={description}
                fontSize={{ base: 'md', lg: 'lg' }}
                color="whiteAlpha.900"
                lineHeight="relaxed"
                whiteSpace="pre-wrap"
                overflowWrap="anywhere"
                lineClamp={expanded ? 'none' : { base: 4, lg: 6 }}
              >
                {collection.description}
              </Text>
            </Box>
            {long && (
              <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.900"
                w="full"
                height="auto"
                minH="44px"
                mt={2}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? 'View less' : 'View more'}
              </Button>
            )}
          </Box>
        )}
        <Box w="full" h="1px" bg="whiteAlpha.200" mb={6} />
        <Grid
          templateColumns={{ base: '120px minmax(0, 1fr)', lg: '140px minmax(0, 1fr)' }}
          columnGap={4}
          rowGap={2}
          pb={1}
          w="full"
        >
          {specs
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <Box key={label} display="contents">
                <Text fontSize={{ base: 'sm', lg: 'md' }} color="shelves.muted">
                  {label}
                </Text>
                <Text fontSize={{ base: 'sm', lg: 'md' }} overflowWrap="anywhere">
                  {value}
                </Text>
              </Box>
            ))}
        </Grid>
        {addons.length > 0 || collection.features?.length || collection.modifications?.length ? (
          <Box w="full" h="1px" bg="whiteAlpha.200" my={6} />
        ) : null}
        {addons.length > 0 && (
          <Box mb={6} w="full">
            <Text fontSize={{ base: 'sm', lg: 'md' }} color="shelves.muted" mb={1}>
              Addons
            </Text>
            {addons.map((addon) => (
              <Text key={addon} fontSize={{ base: 'md', lg: 'lg' }} lineHeight="relaxed">
                {addon}
              </Text>
            ))}
          </Box>
        )}
        {[
          ['Features', collection.features],
          ['Modifications', collection.modifications],
        ].map(
          ([label, tags]) =>
            Array.isArray(tags) &&
            tags.length > 0 && (
              <Box key={String(label)} mb={6} w="full">
                <Text fontSize={{ base: 'sm', lg: 'md' }} color="shelves.muted" mb={2}>
                  {String(label)}
                </Text>
                <Flex wrap="wrap" gap={2}>
                  {tags.map((tag) => (
                    <Box
                      key={tag.id}
                      px={3}
                      py={1}
                      borderWidth="1px"
                      borderColor="whiteAlpha.300"
                      rounded="full"
                      fontSize="sm"
                    >
                      {tag.name}
                    </Box>
                  ))}
                </Flex>
              </Box>
            ),
        )}
      </MotionBox>
    </>
  );
}
