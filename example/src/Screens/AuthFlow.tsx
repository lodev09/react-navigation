import { Button, Text } from '@react-navigation/elements';
import { type PathConfigMap, useTheme } from '@react-navigation/native';
import {
  createStackNavigator,
  type StackScreenProps,
} from '@react-navigation/stack';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

export type AuthStackParams = {
  Home: undefined;
  SignIn: undefined;
  Chat: undefined;
};

const linking: PathConfigMap<AuthStackParams> = {
  Home: '',
  SignIn: 'signin',
  Chat: 'chat',
};

const AUTH_CONTEXT_ERROR =
  'Authentication context not found. Have your wrapped your components with AuthContext.Consumer?';

const AuthContext = React.createContext<{
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
}>({
  isSignedIn: false,
  signIn: () => {
    throw new Error(AUTH_CONTEXT_ERROR);
  },
  signOut: () => {
    throw new Error(AUTH_CONTEXT_ERROR);
  },
});

const SplashScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.content}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
};

const SignInScreen = ({
  navigation,
}: StackScreenProps<AuthStackParams, 'SignIn'>) => {
  const { signIn } = React.useContext(AuthContext);
  const { colors } = useTheme();

  return (
    <View style={styles.content}>
      <TextInput
        placeholder="Username"
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text },
        ]}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text },
        ]}
      />
      <Button variant="filled" onPress={signIn} style={styles.button}>
        Sign in
      </Button>
      <Button onPress={() => navigation.navigate('Chat')} style={styles.button}>
        Go to Chat
      </Button>
    </View>
  );
};

const HomeScreen = ({
  navigation,
}: StackScreenProps<AuthStackParams, 'Home'>) => {
  const { signOut } = React.useContext(AuthContext);

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>Signed in successfully 🎉</Text>
      <Button onPress={signOut} style={styles.button}>
        Sign out
      </Button>
      <Button onPress={() => navigation.navigate('Chat')} style={styles.button}>
        Go to Chat
      </Button>
    </View>
  );
};

const ChatScreen = () => {
  const { isSignedIn, signIn, signOut } = React.useContext(AuthContext);

  return (
    <View style={styles.content}>
      <Text style={styles.heading}>What&apos;s up?</Text>
      {isSignedIn ? (
        <Button onPress={signOut} style={styles.button}>
          Sign out
        </Button>
      ) : (
        <Button onPress={signIn} style={styles.button}>
          Sign in
        </Button>
      )}
    </View>
  );
};

const SimpleStack = createStackNavigator<AuthStackParams>();

type State = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: undefined | string;
};

type Action =
  | { type: 'RESTORE_TOKEN'; token: undefined | string }
  | { type: 'SIGN_IN'; token: string }
  | { type: 'SIGN_OUT' };

export function AuthFlow() {
  const [state, dispatch] = React.useReducer(
    (prevState: State, action: Action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: undefined,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: undefined,
    }
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'RESTORE_TOKEN', token: undefined });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const isSignedIn = state.userToken !== undefined;

  const authContext = React.useMemo(
    () => ({
      isSignedIn,
      signIn: () => dispatch({ type: 'SIGN_IN', token: 'dummy-auth-token' }),
      signOut: () => dispatch({ type: 'SIGN_OUT' }),
    }),
    [isSignedIn]
  );

  if (state.isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={authContext}>
      <SimpleStack.Navigator>
        {!isSignedIn ? (
          <SimpleStack.Screen
            name="SignIn"
            options={{
              title: 'Sign in',
              animationTypeForReplace: state.isSignout ? 'pop' : 'push',
            }}
            component={SignInScreen}
          />
        ) : (
          <SimpleStack.Screen name="Home" component={HomeScreen} />
        )}
        <SimpleStack.Screen
          navigationKey={String(isSignedIn)}
          name="Chat"
          component={ChatScreen}
        />
      </SimpleStack.Navigator>
    </AuthContext.Provider>
  );
}

AuthFlow.title = 'Auth Flow';
AuthFlow.linking = linking;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  input: {
    margin: 8,
    padding: 10,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  button: {
    margin: 8,
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
