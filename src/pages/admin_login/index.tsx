import { Box, Button, Field, Flex, Heading, Input, Stack, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import authServices from '@/services/authServices';
import { canManageCollection, setAuthToken } from '@/services/http';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (canManageCollection()) navigate('/admin/collections', { replace: true });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { token, expiresAt } = await authServices.login(password);
      setAuthToken(token, expiresAt);
      navigate('/admin/collections', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Login | Hobby Collection</title>
      </Helmet>
      <Flex minH="100dvh" align="center" justify="center" px={4} py={8}>
        <Box as="form" onSubmit={handleSubmit} w="full" maxW="md">
          <VStack
            align="stretch"
            gap={6}
            w="full"
            bg="white"
            rounded="xl"
            shadow="lg"
            p={{ base: 6, md: 8 }}
          >
            <Stack gap={1}>
              <Heading size="xl">Admin sign in</Heading>
              <Text color="fg.muted">Enter the admin password to manage the collection.</Text>
            </Stack>

            <Field.Root required invalid={Boolean(errorMessage)}>
              <Field.Label>Password</Field.Label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              {errorMessage && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
            </Field.Root>

            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
              Sign in
            </Button>
          </VStack>
        </Box>
      </Flex>
    </>
  );
};

export default AdminLogin;
