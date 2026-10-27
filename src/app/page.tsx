import { Layout } from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to Automata Playground
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          A comprehensive tool for exploring automata theory and formal languages.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'Simulate',
              description: 'Test strings against DFA and NFA',
              href: '/simulate',
            },
            {
              title: 'Convert',
              description: 'NFA to DFA, minimization, regex conversions',
              href: '/nfa-to-dfa',
            },
            {
              title: 'Language Theory',
              description: 'Grammar classification and pumping lemma',
              href: '/language',
            },
            {
              title: 'Number Systems',
              description: 'Binary, octal, hex converters and validators',
              href: '/numbers',
            },
            {
              title: 'Parser',
              description: 'Parse and analyze model descriptions',
              href: '/parser',
            },
            {
              title: 'Regex',
              description: 'Thompson construction and Arden elimination',
              href: '/regex',
            },
          ].map((feature) => (
            <a
              key={feature.title}
              href={feature.href}
              className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
}
