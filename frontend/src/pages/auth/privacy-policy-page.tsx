import { type ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  LegalDocumentPage,
  type LegalDocumentSection,
  type LegalTocGroup,
} from '@/components/legal/legal-document-page'

const listClassName =
  'my-5 ml-5 list-disc space-y-2.5 pl-2 marker:text-brand-600 sm:ml-6'
const linkClassName =
  'font-medium text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-800 hover:decoration-brand-600 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

function Subsection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="pt-3">
      <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
        <span className="mr-2 tabular-nums text-brand-700">{number}.</span>
        {' '}
        {title}
      </h3>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

const privacySections: LegalDocumentSection[] = [
  {
    number: 1,
    title: 'Quem somos',
    content: (
      <>
        <p>
          O FibroSync é uma plataforma digital destinada a auxiliar pessoas que convivem com a
          fibromialgia no acompanhamento de informações relacionadas à sua rotina, sintomas,
          bem-estar e histórico.
        </p>
        <p className="font-semibold text-slate-900">Controlador dos dados pessoais:</p>
        <dl className="my-6 space-y-3 border-l border-slate-200 pl-5 sm:pl-6">
          <div>
            <dt className="inline font-semibold text-slate-900">Razão social: </dt>
            <dd className="inline">FIBROSYNC INOVA SIMPLES (I.S.)</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">Nome empresarial/marca: </dt>
            <dd className="inline">FibroSync</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">CNPJ: </dt>
            <dd className="inline">66.126.229/0001-85</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">E-mail: </dt>
            <dd className="inline">
              <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
                fibrosync@gmail.com
              </a>
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">Canal de privacidade: </dt>
            <dd className="inline">
              <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
                fibrosync@gmail.com
              </a>
            </dd>
          </div>
        </dl>
        <aside className="my-7 border-l-4 border-brand-500 bg-brand-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="font-medium text-slate-800">
              Para fins da legislação brasileira de proteção de dados, especialmente a Lei nº
              13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD), o controlador é
              responsável pelas decisões referentes ao tratamento dos dados pessoais realizado no
              âmbito do FibroSync.
            </p>
          </div>
        </aside>
      </>
    ),
  },
  {
    number: 2,
    title: 'O que significa "tratamento de dados"',
    content: (
      <>
        <p>
          Nesta Política, o termo <strong>tratamento</strong> abrange operações realizadas com dados
          pessoais, incluindo, conforme aplicável:
        </p>
        <ul className={listClassName}>
          <li>coleta;</li>
          <li>registro;</li>
          <li>armazenamento;</li>
          <li>organização;</li>
          <li>consulta;</li>
          <li>utilização;</li>
          <li>análise;</li>
          <li>compartilhamento;</li>
          <li>alteração;</li>
          <li>exclusão;</li>
          <li>anonimização;</li>
          <li>transmissão;</li>
          <li>disponibilização;</li>
          <li>outras operações necessárias ao funcionamento do FibroSync.</li>
        </ul>
      </>
    ),
  },
  {
    number: 3,
    title: 'Quais dados podemos coletar',
    content: (
      <>
        <p>Os dados coletados podem variar de acordo com as funcionalidades utilizadas pelo usuário.</p>
        <Subsection number="3.1" title="Dados de cadastro">
          <p>Podemos coletar informações necessárias para criação e gerenciamento da conta, como:</p>
          <ul className={listClassName}>
            <li>nome;</li>
            <li>e-mail;</li>
            <li>senha ou credenciais de autenticação;</li>
            <li>identificadores da conta;</li>
            <li>informações necessárias para autenticação;</li>
            <li>outras informações fornecidas durante o cadastro.</li>
          </ul>
          <p>
            Quando forem utilizados serviços externos de autenticação, determinados dados poderão ser
            recebidos do respectivo provedor, conforme a autorização e configuração utilizadas pelo
            usuário.
          </p>
        </Subsection>
      </>
    ),
  },
  {
    number: 4,
    title: 'Dados relacionados à saúde',
    content: (
      <>
        <p>
          O FibroSync poderá permitir que o usuário registre informações relacionadas à sua saúde e
          bem-estar.
        </p>
        <p>Dependendo das funcionalidades disponíveis, essas informações poderão incluir:</p>
        <ul className={listClassName}>
          <li>intensidade da dor;</li>
          <li>localização da dor;</li>
          <li>regiões do corpo;</li>
          <li>sintomas;</li>
          <li>qualidade do sono;</li>
          <li>humor;</li>
          <li>nível de energia;</li>
          <li>possíveis gatilhos ou fatores associados;</li>
          <li>percepção de bem-estar;</li>
          <li>observações pessoais;</li>
          <li>histórico dos registros;</li>
          <li>informações relacionadas à rotina;</li>
          <li>outras informações fornecidas voluntariamente pelo usuário.</li>
        </ul>
        <aside className="my-7 border-l-4 border-brand-500 bg-brand-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <div className="space-y-3 font-medium text-slate-800">
              <p>
                Informações relacionadas à saúde são consideradas <strong>dados pessoais sensíveis</strong>{' '}
                pela legislação brasileira.
              </p>
              <p>
                Por essa razão, o FibroSync deverá adotar cuidados adicionais no tratamento dessas
                informações e utilizar as bases legais adequadas para cada finalidade.
              </p>
            </div>
          </div>
        </aside>
      </>
    ),
  },
  {
    number: 5,
    title: 'Dados de profissionais de saúde',
    content: (
      <>
        <p>
          Quando funcionalidades destinadas a profissionais estiverem disponíveis, o FibroSync poderá
          tratar informações relacionadas ao profissional e ao relacionamento entre profissional e
          paciente.
        </p>
        <p>Essas informações poderão incluir:</p>
        <ul className={listClassName}>
          <li>nome;</li>
          <li>e-mail;</li>
          <li>identificadores da conta;</li>
          <li>informações profissionais fornecidas pelo próprio profissional;</li>
          <li>informações necessárias para validação ou gerenciamento da conta profissional;</li>
          <li>vínculo ou autorização de acesso a determinados pacientes;</li>
          <li>registros relacionados à utilização da plataforma.</li>
        </ul>
        <p>
          Quando aplicável, o FibroSync poderá solicitar informações adicionais para processos de
          verificação profissional.
        </p>
      </>
    ),
  },
  {
    number: 6,
    title: 'Dados relacionados ao compartilhamento paciente-profissional',
    content: (
      <>
        <p>
          Quando o usuário optar por utilizar funcionalidades de acompanhamento profissional,
          determinados registros poderão ser compartilhados com um profissional autorizado pelo
          próprio usuário.
        </p>
        <p>O compartilhamento poderá incluir, conforme a funcionalidade utilizada:</p>
        <ul className={listClassName}>
          <li>histórico de sintomas;</li>
          <li>registros de dor;</li>
          <li>informações sobre sono;</li>
          <li>humor;</li>
          <li>energia;</li>
          <li>regiões do corpo;</li>
          <li>observações;</li>
          <li>gráficos;</li>
          <li>padrões ou informações derivadas dos registros;</li>
          <li>outras informações disponibilizadas pela funcionalidade.</li>
        </ul>
        <p>O acesso deverá respeitar as permissões e mecanismos disponibilizados pelo FibroSync.</p>
        <p>
          O usuário poderá, quando a funcionalidade estiver disponível, cancelar ou revogar o
          compartilhamento conforme os mecanismos disponibilizados pela plataforma.
        </p>
      </>
    ),
  },
  {
    number: 7,
    title: 'Dados técnicos e de utilização',
    content: (
      <>
        <p>
          Para funcionamento, segurança e melhoria da plataforma, determinados dados técnicos poderão
          ser tratados, incluindo, quando aplicável:
        </p>
        <ul className={listClassName}>
          <li>endereço IP;</li>
          <li>informações do dispositivo;</li>
          <li>sistema operacional;</li>
          <li>navegador;</li>
          <li>identificadores técnicos;</li>
          <li>data e horário de acesso;</li>
          <li>registros de autenticação;</li>
          <li>informações de sessão;</li>
          <li>registros de erros;</li>
          <li>informações de segurança;</li>
          <li>eventos de utilização da plataforma.</li>
        </ul>
        <p>
          Esses dados poderão ser utilizados para segurança, diagnóstico técnico, prevenção de abuso e
          melhoria do serviço.
        </p>
      </>
    ),
  },
  {
    number: 8,
    title: 'Dados relacionados ao clima',
    content: (
      <>
        <p>
          Determinadas funcionalidades do FibroSync poderão utilizar informações climáticas para
          apresentar contexto associado aos registros realizados pelo usuário.
        </p>
        <p>Dependendo da implementação, poderão ser utilizados dados como:</p>
        <ul className={listClassName}>
          <li>temperatura;</li>
          <li>umidade;</li>
          <li>precipitação;</li>
          <li>pressão atmosférica;</li>
          <li>outras informações meteorológicas.</li>
        </ul>
        <p>
          Quando essas informações forem obtidas de serviços externos, o FibroSync poderá utilizar APIs
          ou provedores especializados.
        </p>
        <p>Os dados climáticos utilizados pelo sistema não constituem diagnóstico ou conclusão médica.</p>
        <p>
          A associação entre informações climáticas e registros pessoais deverá ser interpretada como
          informação contextual ou descritiva.
        </p>
      </>
    ),
  },
  {
    number: 9,
    title: 'Como coletamos os dados',
    content: (
      <>
        <p>Os dados poderão ser coletados:</p>
        <Subsection number="9.1" title="Diretamente do usuário">
          <p>Por meio de:</p>
          <ul className={listClassName}>
            <li>cadastro;</li>
            <li>formulários;</li>
            <li>check-ins;</li>
            <li>registros de sintomas;</li>
            <li>registros de rotina;</li>
            <li>configurações;</li>
            <li>solicitações;</li>
            <li>interações com funcionalidades da plataforma.</li>
          </ul>
        </Subsection>
        <Subsection number="9.2" title="Automaticamente">
          <p>
            Por meio de mecanismos técnicos necessários ao funcionamento do sistema, como registros de
            acesso, autenticação, segurança e diagnóstico.
          </p>
        </Subsection>
        <Subsection number="9.3" title="Por meio de serviços integrados">
          <p>
            Quando o usuário utilizar funcionalidades que dependam de serviços externos, determinadas
            informações poderão ser recebidas ou processadas por esses serviços, conforme suas
            respectivas políticas e configurações.
          </p>
        </Subsection>
      </>
    ),
  },
  {
    number: 10,
    title: 'Para que utilizamos os dados',
    content: (
      <>
        <p>Os dados poderão ser tratados para as seguintes finalidades:</p>
        <Subsection number="10.1" title="Criação e gerenciamento da conta">
          <p>Utilizamos dados necessários para:</p>
          <ul className={listClassName}>
            <li>criar contas;</li>
            <li>autenticar usuários;</li>
            <li>manter sessões;</li>
            <li>recuperar acesso;</li>
            <li>administrar perfis;</li>
            <li>disponibilizar funcionalidades.</li>
          </ul>
        </Subsection>
        <Subsection number="10.2" title="Funcionamento do FibroSync">
          <p>
            Os dados são utilizados para fornecer as funcionalidades solicitadas pelo usuário,
            incluindo:
          </p>
          <ul className={listClassName}>
            <li>registros;</li>
            <li>check-ins;</li>
            <li>histórico;</li>
            <li>gráficos;</li>
            <li>organização das informações;</li>
            <li>acompanhamento da rotina;</li>
            <li>visualização de padrões;</li>
            <li>demais recursos disponibilizados.</li>
          </ul>
        </Subsection>
        <Subsection number="10.3" title="Personalização da experiência">
          <p>
            Determinados dados poderão ser utilizados para adaptar a apresentação das informações ao
            usuário e fornecer funcionalidades relacionadas ao seu histórico.
          </p>
        </Subsection>
        <Subsection number="10.4" title="Geração de informações e padrões">
          <p>Os registros fornecidos pelo usuário poderão ser processados para gerar:</p>
          <ul className={listClassName}>
            <li>gráficos;</li>
            <li>estatísticas pessoais;</li>
            <li>comparações históricas;</li>
            <li>tendências;</li>
            <li>padrões;</li>
            <li>informações contextuais;</li>
            <li>outros insights relacionados aos registros.</li>
          </ul>
          <p>Essas funcionalidades não deverão ser interpretadas como diagnóstico médico.</p>
        </Subsection>
        <Subsection number="10.5" title="Compartilhamento com profissionais">
          <p>
            Quando autorizado pelo usuário e disponibilizado pela plataforma, os dados poderão ser
            tratados para permitir que profissionais acompanhem informações disponibilizadas pelo
            paciente.
          </p>
        </Subsection>
        <Subsection number="10.6" title="Segurança">
          <p>
            Os dados técnicos e informações relacionadas à utilização da plataforma poderão ser
            utilizados para:
          </p>
          <ul className={listClassName}>
            <li>prevenir acessos não autorizados;</li>
            <li>detectar atividades suspeitas;</li>
            <li>investigar incidentes;</li>
            <li>proteger contas;</li>
            <li>prevenir fraude;</li>
            <li>proteger a infraestrutura;</li>
            <li>manter a integridade da plataforma.</li>
          </ul>
        </Subsection>
        <Subsection number="10.7" title="Cumprimento de obrigações legais">
          <p>
            Os dados poderão ser tratados quando necessário para cumprir obrigações legais ou
            regulatórias aplicáveis ao FibroSync.
          </p>
        </Subsection>
        <Subsection number="10.8" title="Exercício regular de direitos">
          <p>
            Determinados dados poderão ser mantidos ou utilizados para exercício regular de direitos em
            processos judiciais, administrativos ou arbitrais, quando aplicável.
          </p>
        </Subsection>
      </>
    ),
  },
  {
    number: 11,
    title: 'Bases legais',
    content: (
      <>
        <p>
          O FibroSync deverá utilizar uma base legal adequada para cada finalidade de tratamento,
          conforme previsto na legislação aplicável.
        </p>
        <p>
          Dependendo da finalidade e das circunstâncias, poderão ser utilizadas bases legais previstas
          na LGPD, incluindo:
        </p>
        <ul className={listClassName}>
          <li>execução de contrato ou de procedimentos relacionados ao contrato;</li>
          <li>cumprimento de obrigação legal ou regulatória;</li>
          <li>exercício regular de direitos;</li>
          <li>legítimo interesse, quando aplicável e juridicamente adequado;</li>
          <li>consentimento, quando aplicável;</li>
          <li>bases legais específicas para dados pessoais sensíveis.</li>
        </ul>
        <p>
          A existência de consentimento para determinada finalidade não significa que todos os
          tratamentos realizados pelo FibroSync dependam necessariamente de consentimento.
        </p>
        <p>
          A base legal aplicável deverá ser definida de acordo com a finalidade concreta do tratamento.
        </p>
      </>
    ),
  },
  {
    number: 12,
    title: 'Consentimento',
    content: (
      <>
        <p>
          Quando o tratamento depender de consentimento, o usuário deverá receber informações claras
          sobre a finalidade para a qual o consentimento está sendo solicitado.
        </p>
        <p>
          O consentimento deverá ser fornecido de maneira livre, informada e inequívoca, quando exigido
          pela legislação.
        </p>
        <p>
          Quando juridicamente aplicável, o usuário poderá retirar o consentimento mediante solicitação
          ou pelos mecanismos disponibilizados pelo FibroSync.
        </p>
        <p>
          A retirada do consentimento não necessariamente invalida os tratamentos realizados
          anteriormente com base em consentimento válido, nem impede tratamentos que possam continuar
          fundamentados em outra base legal permitida pela legislação.
        </p>
      </>
    ),
  },
  {
    number: 13,
    title: 'Compartilhamento de dados',
    content: (
      <>
        <p>O FibroSync não realiza compartilhamento indiscriminado de dados pessoais.</p>
        <p>
          Os dados poderão ser compartilhados quando necessário para finalidades legítimas e
          previamente informadas, incluindo, conforme aplicável:
        </p>
        <ul className={listClassName}>
          <li>profissionais autorizados pelo usuário;</li>
          <li>provedores de hospedagem;</li>
          <li>provedores de banco de dados;</li>
          <li>provedores de autenticação;</li>
          <li>serviços de infraestrutura;</li>
          <li>serviços de monitoramento;</li>
          <li>serviços necessários ao funcionamento da plataforma;</li>
          <li>autoridades públicas, quando houver obrigação legal;</li>
          <li>prestadores de serviços que atuem em nome do FibroSync.</li>
        </ul>
        <p>
          Quando terceiros tratarem dados pessoais em nome do FibroSync, deverão ser estabelecidas
          medidas contratuais, técnicas ou administrativas compatíveis com a natureza do tratamento,
          conforme aplicável.
        </p>
      </>
    ),
  },
  {
    number: 14,
    title: 'Provedores de tecnologia',
    content: (
      <>
        <p>O funcionamento do FibroSync poderá depender de fornecedores de tecnologia.</p>
        <p>Dependendo da arquitetura efetivamente utilizada, poderão existir fornecedores relacionados a:</p>
        <ul className={listClassName}>
          <li>hospedagem;</li>
          <li>banco de dados;</li>
          <li>armazenamento;</li>
          <li>autenticação;</li>
          <li>infraestrutura;</li>
          <li>envio de e-mails;</li>
          <li>monitoramento;</li>
          <li>análise de erros;</li>
          <li>APIs externas;</li>
          <li>serviços meteorológicos.</li>
        </ul>
        <p className="font-semibold text-slate-900">Lista de fornecedores utilizados atualmente:</p>
        <div
          className="my-7 overflow-x-auto border-y border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          role="region"
          aria-label="Tabela de fornecedores de tecnologia"
          tabIndex={0}
        >
          <table className="min-w-[46rem] border-collapse text-left text-sm leading-6">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-900">
                <th scope="col" className="w-[24%] px-4 py-3 font-semibold">Serviço</th>
                <th scope="col" className="w-[21%] px-4 py-3 font-semibold">Finalidade</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo de dado tratado</th>
              </tr>
            </thead>
            <tbody className="align-top [&_tr:not(:last-child)]:border-b [&_tr:not(:last-child)]:border-slate-200">
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Vercel (frontend) e Render (backend, a confirmar)</td>
                <td className="px-4 py-4">Hospedagem</td>
                <td className="px-4 py-4">
                  Frontend: arquivos da aplicação e metadados de acesso, como IP e informações do
                  navegador. Backend: processamento de dados cadastrais, autenticação, registros de
                  saúde e requisições da aplicação.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Supabase — PostgreSQL</td>
                <td className="px-4 py-4">Banco de dados</td>
                <td className="px-4 py-4">
                  Dados cadastrais e profissionais, hashes de senhas e tokens, sessões, dados de saúde,
                  sintomas, registros diários, relatórios, notas médicas, dados climáticos e registros
                  de auditoria.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Autenticação própria — NestJS, JWT e bcrypt</td>
                <td className="px-4 py-4">Autenticação</td>
                <td className="px-4 py-4">
                  E-mail, senha para validação, hash da senha, identificador do usuário, perfil de
                  acesso, tokens de sessão, endereço IP e informações do navegador.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Open-Meteo API</td>
                <td className="px-4 py-4">Clima/API</td>
                <td className="px-4 py-4">
                  Latitude e longitude para consulta; temperatura, umidade, sensação térmica,
                  precipitação, pressão atmosférica, velocidade do vento e condição do tempo.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Google Gemini API</td>
                <td className="px-4 py-4">Inteligência artificial e análise de padrões</td>
                <td className="px-4 py-4">
                  Dados de saúde e rotina: sintomas, sono, fadiga, humor, estresse, atividade física,
                  hidratação, uso de medicamentos, observações, histórico e contexto climático.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium text-slate-900">Logger nativo do NestJS</td>
                <td className="px-4 py-4">Monitoramento</td>
                <td className="px-4 py-4">
                  Logs de requisições, métodos e URLs, status HTTP, tempo de resposta, erros, rastros de
                  execução e identificadores de usuários em determinados avisos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Essa lista deverá ser atualizada quando houver alterações relevantes na infraestrutura.</p>
      </>
    ),
  },
  {
    number: 15,
    title: 'Transferência internacional de dados',
    content: (
      <>
        <p>
          Alguns fornecedores utilizados pelo FibroSync poderão estar localizados fora do Brasil ou
          poderão processar dados em outros países.
        </p>
        <p>
          Quando houver transferência internacional de dados pessoais, o FibroSync deverá observar os
          requisitos previstos na legislação brasileira e nas regulamentações aplicáveis.
        </p>
        <p>
          As transferências internacionais deverão ocorrer somente quando houver fundamento jurídico
          adequado e mecanismos compatíveis com a legislação aplicável.
        </p>
        <p>
          Fornecedores que realizam ou podem realizar processamento internacional: <strong>Vercel,
          Render, Supabase, Google (Gemini API) e Open-Meteo</strong>, conforme os serviços utilizados,
          suas configurações e respectivas infraestruturas.
        </p>
      </>
    ),
  },
  {
    number: 16,
    title: 'Retenção dos dados',
    content: (
      <>
        <p>Os dados pessoais não serão necessariamente armazenados por período indeterminado.</p>
        <p>O período de retenção poderá variar conforme:</p>
        <ul className={listClassName}>
          <li>finalidade do tratamento;</li>
          <li>tipo de dado;</li>
          <li>utilização da conta;</li>
          <li>obrigações legais;</li>
          <li>obrigações regulatórias;</li>
          <li>necessidade de exercício regular de direitos;</li>
          <li>requisitos de segurança;</li>
          <li>prevenção de fraude;</li>
          <li>necessidade de manutenção de registros.</li>
        </ul>
        <p>
          Quando não houver necessidade legítima para manutenção dos dados, eles poderão ser
          eliminados, anonimizados ou submetidos a outra forma de tratamento permitida pela legislação.
        </p>
      </>
    ),
  },
  {
    number: 17,
    title: 'Exclusão da conta',
    content: (
      <>
        <p>
          O usuário poderá solicitar o encerramento da sua conta pelos mecanismos disponibilizados pelo
          FibroSync.
        </p>
        <p>A exclusão da conta não significa necessariamente eliminação imediata de todas as informações.</p>
        <p>Alguns dados poderão ser mantidos quando houver fundamento legal para isso, incluindo:</p>
        <ul className={listClassName}>
          <li>cumprimento de obrigação legal;</li>
          <li>exercício regular de direitos;</li>
          <li>prevenção de fraude;</li>
          <li>segurança;</li>
          <li>cumprimento de determinação de autoridade competente.</li>
        </ul>
        <p>
          Quando os dados não puderem ser imediatamente eliminados por uma dessas razões, eles deverão
          ser mantidos apenas pelo período necessário à finalidade correspondente, observada a
          legislação aplicável.
        </p>
      </>
    ),
  },
  {
    number: 18,
    title: 'Dados anonimizados',
    content: (
      <>
        <p>
          Quando tecnicamente e juridicamente adequado, o FibroSync poderá utilizar dados de forma
          anonimizada para finalidades compatíveis com o desenvolvimento da plataforma.
        </p>
        <p>
          Dados efetivamente anonimizados, de acordo com a legislação aplicável e considerando os meios
          razoáveis disponíveis para reversão, deixam de ser considerados dados pessoais nos termos
          aplicáveis da LGPD.
        </p>
        <p>
          A anonimização deverá ser avaliada considerando o risco de reidentificação e as
          características do conjunto de dados.
        </p>
      </>
    ),
  },
  {
    number: 19,
    title: 'Pesquisas e estudos futuros',
    content: (
      <>
        <p>
          O FibroSync poderá futuramente desenvolver projetos destinados à produção de conhecimento,
          pesquisas, estudos estatísticos ou análises relacionadas à fibromialgia.
        </p>
        <p>
          A utilização de dados pessoais para essas finalidades não será presumida simplesmente pela
          utilização da plataforma.
        </p>
        <p>
          Quando determinada pesquisa exigir uma autorização específica, consentimento ou outro
          requisito legal, o procedimento correspondente deverá ser apresentado separadamente ao
          usuário.
        </p>
        <p>
          Quando possível e juridicamente adequado, poderão ser utilizados dados anonimizados ou
          agregados.
        </p>
        <p>
          A comercialização ou disponibilização de dados pessoais identificáveis para terceiros não
          será presumida pela aceitação desta Política de Privacidade.
        </p>
      </>
    ),
  },
  {
    number: 20,
    title: 'Segurança dos dados',
    content: (
      <>
        <p>
          O FibroSync adota ou deverá adotar medidas técnicas e administrativas proporcionais aos riscos
          envolvidos no tratamento dos dados.
        </p>
        <p>Essas medidas poderão incluir:</p>
        <ul className={listClassName}>
          <li>controle de acesso;</li>
          <li>autenticação;</li>
          <li>proteção de credenciais;</li>
          <li>criptografia em trânsito;</li>
          <li>segregação de permissões;</li>
          <li>controle de acesso por função;</li>
          <li>monitoramento;</li>
          <li>registros de segurança;</li>
          <li>backups;</li>
          <li>proteção da infraestrutura;</li>
          <li>atualizações de software;</li>
          <li>gerenciamento de credenciais e segredos;</li>
          <li>procedimentos de resposta a incidentes.</li>
        </ul>
        <p>As medidas poderão ser alteradas conforme a evolução da infraestrutura.</p>
        <p>Nenhuma tecnologia conectada à internet oferece segurança absoluta.</p>
        <p>
          Por isso, embora sejam adotadas medidas razoáveis de proteção, não é possível garantir que um
          incidente de segurança jamais ocorrerá.
        </p>
      </>
    ),
  },
  {
    number: 21,
    title: 'Incidentes de segurança',
    content: (
      <>
        <p>
          Caso ocorra um incidente envolvendo dados pessoais, o FibroSync deverá realizar avaliação da
          situação e adotar as medidas cabíveis conforme a legislação aplicável.
        </p>
        <p>
          Quando houver obrigação legal de comunicação, os titulares e/ou a autoridade competente
          poderão ser comunicados dentro dos procedimentos e prazos aplicáveis.
        </p>
        <p>As medidas adotadas poderão incluir:</p>
        <ul className={listClassName}>
          <li>contenção do incidente;</li>
          <li>investigação;</li>
          <li>correção de vulnerabilidades;</li>
          <li>restauração de sistemas;</li>
          <li>avaliação de impacto;</li>
          <li>comunicação às autoridades;</li>
          <li>comunicação aos titulares, quando aplicável.</li>
        </ul>
      </>
    ),
  },
  {
    number: 22,
    title: 'Cookies e tecnologias semelhantes',
    content: (
      <>
        <p>
          O FibroSync poderá utilizar cookies, armazenamento local, tokens de sessão e tecnologias
          semelhantes necessárias ao funcionamento da plataforma.
        </p>
        <p>Essas tecnologias poderão ser utilizadas para:</p>
        <ul className={listClassName}>
          <li>autenticação;</li>
          <li>manutenção de sessão;</li>
          <li>segurança;</li>
          <li>preferências;</li>
          <li>funcionamento das funcionalidades;</li>
          <li>diagnóstico técnico;</li>
          <li>melhoria da plataforma.</li>
        </ul>
        <p>
          Quando forem utilizados cookies ou tecnologias não estritamente necessárias ao funcionamento
          do serviço, o FibroSync deverá observar os requisitos legais aplicáveis e disponibilizar os
          mecanismos de escolha correspondentes, quando exigidos.
        </p>
      </>
    ),
  },
  {
    number: 23,
    title: 'Direitos dos titulares',
    content: (
      <>
        <p>O titular de dados pessoais possui os direitos previstos na legislação aplicável.</p>
        <p>
          Dependendo da situação e da base legal utilizada, esses direitos poderão incluir:
        </p>
        <ul className={listClassName}>
          <li>confirmação da existência de tratamento;</li>
          <li>acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados, quando aplicável;</li>
          <li>portabilidade;</li>
          <li>informação sobre compartilhamento;</li>
          <li>informação sobre a possibilidade de não fornecer consentimento;</li>
          <li>revogação do consentimento;</li>
          <li>oposição ao tratamento, quando aplicável;</li>
          <li>revisão de decisões automatizadas, quando aplicável;</li>
          <li>demais direitos previstos na legislação.</li>
        </ul>
        <p>
          A aplicação de determinado direito poderá depender da base legal utilizada, da finalidade do
          tratamento e das limitações previstas na legislação.
        </p>
      </>
    ),
  },
  {
    number: 24,
    title: 'Como exercer seus direitos',
    content: (
      <>
        <p>O usuário poderá exercer seus direitos por meio do canal:</p>
        <p>
          <strong>E-mail de privacidade: </strong>
          <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
            fibrosync@gmail.com
          </a>
        </p>
        <p>
          Ao realizar uma solicitação, poderemos solicitar informações razoavelmente necessárias para
          confirmar a identidade do solicitante e evitar que dados pessoais sejam fornecidos a terceiros
          não autorizados.
        </p>
        <p>As solicitações serão analisadas de acordo com a legislação aplicável.</p>
        <p>
          Quando um pedido não puder ser atendido total ou parcialmente, o FibroSync poderá apresentar
          as razões legais correspondentes.
        </p>
      </>
    ),
  },
  {
    number: 25,
    title: 'Crianças e adolescentes',
    content: (
      <>
        <p>
          O FibroSync é destinado, salvo indicação expressa em contrário, a usuários com <strong>18 anos
          ou mais</strong>.
        </p>
        <p>
          Caso a plataforma venha a disponibilizar funcionalidades destinadas a crianças ou
          adolescentes, serão implementadas medidas específicas de proteção e tratamento de dados
          conforme a legislação aplicável.
        </p>
        <p>
          Caso o FibroSync identifique que coletou dados de menor em situação que exija tratamento
          diferenciado, serão avaliadas as medidas cabíveis.
        </p>
      </>
    ),
  },
  {
    number: 26,
    title: 'Dados de terceiros',
    content: (
      <>
        <p>
          O usuário deverá evitar inserir informações pessoais de terceiros quando isso não for
          necessário para utilização da plataforma.
        </p>
        <p>
          Caso seja necessário inserir informações de terceiros, o usuário deverá possuir autorização
          ou outro fundamento jurídico adequado quando exigido pela legislação.
        </p>
        <p>O usuário não deverá inserir dados de terceiros de maneira indiscriminada.</p>
      </>
    ),
  },
  {
    number: 27,
    title: 'Serviços de terceiros',
    content: (
      <>
        <p>
          O FibroSync poderá disponibilizar links, integrações ou funcionalidades dependentes de
          serviços externos.
        </p>
        <p>Esses serviços poderão possuir suas próprias políticas de privacidade e termos de uso.</p>
        <p>
          Quando o usuário utilizar diretamente um serviço externo, o tratamento realizado pelo
          respectivo fornecedor poderá estar sujeito às regras desse terceiro.
        </p>
        <p>
          O FibroSync não controla integralmente as práticas de privacidade de serviços externos
          independentes.
        </p>
      </>
    ),
  },
  {
    number: 28,
    title: 'Dados não utilizados para finalidade incompatível',
    content: (
      <>
        <p>
          O FibroSync não deverá utilizar dados pessoais para finalidade incompatível com aquela
          informada ao titular ou permitida pela legislação.
        </p>
        <p>
          Caso seja necessário realizar tratamento para nova finalidade que exija informação adicional,
          consentimento ou outra providência jurídica, o FibroSync deverá adotar o procedimento
          correspondente.
        </p>
      </>
    ),
  },
  {
    number: 29,
    title: 'Perfil, análises e decisões automatizadas',
    content: (
      <>
        <p>
          O FibroSync poderá processar os registros do usuário para gerar informações, gráficos,
          estatísticas e padrões relacionados à utilização da plataforma.
        </p>
        <p>
          Esses processamentos deverão ter caráter compatível com a finalidade da plataforma.
        </p>
        <p>
          Quando houver tratamento que possa caracterizar decisão automatizada que afete os interesses
          do titular, serão observados os direitos e requisitos previstos na legislação aplicável.
        </p>
        <p>
          As análises realizadas pelo FibroSync não devem ser interpretadas como diagnóstico médico ou
          decisão clínica automatizada.
        </p>
      </>
    ),
  },
  {
    number: 30,
    title: 'Responsabilidade do usuário',
    content: (
      <>
        <p>O usuário é responsável por:</p>
        <ul className={listClassName}>
          <li>manter suas credenciais seguras;</li>
          <li>fornecer informações corretas;</li>
          <li>evitar compartilhamento indevido de sua conta;</li>
          <li>utilizar a plataforma de acordo com os Termos de Uso;</li>
          <li>comunicar acessos não autorizados;</li>
          <li>evitar inserção desnecessária de dados de terceiros.</li>
        </ul>
        <p>
          O usuário também deverá verificar as informações apresentadas pelo sistema antes de utilizá-las
          para qualquer finalidade relevante.
        </p>
      </>
    ),
  },
  {
    number: 31,
    title: 'Alterações desta Política',
    content: (
      <>
        <p>Esta Política poderá ser atualizada para refletir:</p>
        <ul className={listClassName}>
          <li>alterações legais;</li>
          <li>alterações regulatórias;</li>
          <li>novas funcionalidades;</li>
          <li>alterações na infraestrutura;</li>
          <li>novos fornecedores;</li>
          <li>alterações nas finalidades de tratamento;</li>
          <li>melhorias de segurança;</li>
          <li>mudanças na operação do FibroSync.</li>
        </ul>
        <p>
          Quando houver alterações relevantes, o FibroSync poderá comunicar os usuários por meio da
          plataforma, e-mail ou outros canais disponíveis.
        </p>
        <p>
          Quando a legislação exigir nova manifestação do usuário, será adotado o procedimento
          correspondente.
        </p>
        <p>A versão vigente deverá permanecer disponível para consulta.</p>
      </>
    ),
  },
  {
    number: 32,
    title: 'Encarregado pelo tratamento de dados pessoais',
    content: (
      <>
        <p>
          Quando aplicável, o FibroSync disponibilizará informações sobre seu <strong>Encarregado pelo
          Tratamento de Dados Pessoais (DPO)</strong>.
        </p>
        <dl className="my-6 space-y-3 border-l border-slate-200 pl-5 sm:pl-6">
          <div>
            <dt className="inline font-semibold text-slate-900">Nome: </dt>
            <dd className="inline">Fibrosync</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">E-mail: </dt>
            <dd className="inline">
              <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
                fibrosync@gmail.com
              </a>
            </dd>
          </div>
        </dl>
        <p>
          O canal poderá ser utilizado para assuntos relacionados à proteção de dados pessoais e às
          solicitações previstas na legislação.
        </p>
        <p>
          Caso a estrutura do FibroSync esteja dispensada da indicação de encarregado ou esteja sujeita
          a regime específico previsto pela regulamentação aplicável, o canal de comunicação
          correspondente deverá ser informado nesta Política.
        </p>
      </>
    ),
  },
  {
    number: 33,
    title: 'Autoridade Nacional de Proteção de Dados',
    content: (
      <p>
        O titular também poderá buscar informações e orientações junto à <strong>Autoridade Nacional de
        Proteção de Dados (ANPD)</strong> pelos canais oficiais disponibilizados pela autoridade.
      </p>
    ),
  },
  {
    number: 34,
    title: 'Contato',
    content: (
      <>
        <p>Para dúvidas gerais:</p>
        <dl className="my-6 space-y-3 border-l border-slate-200 pl-5 sm:pl-6">
          <div>
            <dt className="inline font-semibold text-slate-900">FibroSync: </dt>
            <dd className="inline">FIBROSYNC INOVA SIMPLES (I.S.)</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">CNPJ: </dt>
            <dd className="inline">66.126.229/0001-85</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">E-mail: </dt>
            <dd className="inline">
              <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
                fibrosync@gmail.com
              </a>
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">E-mail de privacidade: </dt>
            <dd className="inline">
              <a href="mailto:fibrosync@gmail.com" className={linkClassName}>
                fibrosync@gmail.com
              </a>
            </dd>
          </div>
        </dl>
      </>
    ),
  },
  {
    number: 35,
    title: 'Vigência',
    content: (
      <>
        <p>Esta Política de Privacidade entra em vigor na data indicada no início do documento.</p>
        <p>Última atualização: 30 de setembro de 2026.</p>
      </>
    ),
  },
]

const tocGroups: LegalTocGroup[] = [
  { label: 'Introdução e escopo', sectionNumbers: [1, 2] },
  { label: 'Dados coletados', sectionNumbers: [3, 4, 5, 6, 7, 8] },
  { label: 'Coleta e utilização', sectionNumbers: [9, 10, 11, 12] },
  { label: 'Compartilhamento e fornecedores', sectionNumbers: [13, 14, 15] },
  { label: 'Retenção e segurança', sectionNumbers: [16, 17, 18, 19, 20, 21, 22] },
  { label: 'Direitos e proteção', sectionNumbers: [23, 24, 25, 26, 27, 28, 29] },
  { label: 'Disposições finais', sectionNumbers: [30, 31, 32, 33, 34, 35] },
]

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      documentTitle="Política de Privacidade | FibroSync"
      title="Política de Privacidade"
      intro={
        <>
          <p>
            A presente Política de Privacidade explica como o FibroSync realiza o tratamento de
            dados pessoais de seus usuários, quais informações podem ser coletadas, para quais
            finalidades podem ser utilizadas, com quem podem ser compartilhadas e quais direitos
            podem ser exercidos pelos titulares.
          </p>
          <p>
            O FibroSync reconhece a importância da proteção de dados pessoais, especialmente em
            razão da natureza das informações que podem ser registradas na plataforma.
          </p>
          <p>
            Esta Política deve ser lida em conjunto com os{' '}
            <Link to="/termos-de-uso" className={linkClassName}>
              Termos de Uso do FibroSync
            </Link>
            .
          </p>
        </>
      }
      lastUpdated="30 de setembro de 2026"
      lastUpdatedDateTime="2026-09-30"
      sections={privacySections}
      tocGroups={tocGroups}
      tocAriaLabel="Índice da Política de Privacidade"
      navigationAriaLabel="Navegação da Política de Privacidade"
      currentPath="/politica-de-privacidade"
    />
  )
}
